import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, atTime, chance, dateBetween, names, pick, ri, roundTo, sample } from "./kit.js";

/**
 * Microsoft: the questions a data analyst or data engineer at Microsoft gets
 * asked across its businesses — Azure FinOps (idle VMs, budgets, consumption
 * by service family, management-group roll-ups, prepayment overage), Microsoft
 * 365 and Teams (licences, sign-ins, mailbox quotas, guest-heavy channels,
 * weekly actives, meeting attendance), Xbox and Game Pass (gamerscore,
 * completions, rare achievements, win-backs), Bing (abandonment, search
 * sessions), GitHub (contributors, time to first review), Windows Insider
 * flights and Azure support. Every schema and figure is fictional — written
 * for practice, not Microsoft's own tables or numbers. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad = (n: number) => String(n).padStart(2, "0");
/** 'YYYY-MM-DD HH:MM:00' from a date and minutes after midnight (may roll into the next day). */
const at = (date: string, minutes: number): string => {
  const d = addDays(date, Math.floor(minutes / 1440));
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${d} ${pad(Math.floor(m / 60))}:${pad(m % 60)}:00`;
};
const upnOf = (name: string, domain = "contoso.com") => `${name.toLowerCase()}@${domain}`;

const GAMERTAGS = ["NovaRiya", "PixelPriya", "ShadowKabir", "BlazeArjun", "EchoZara", "ByteMeera", "OrbitDev", "LunaIra", "StormVik", "ZenAisha"] as const;
const XBOX_TITLES = ["Halo Infinite", "Forza Horizon 5", "Starfield", "Sea of Thieves", "Hi-Fi Rush", "Microsoft Flight Simulator", "Age of Empires IV", "Grounded"] as const;
const CUSTOMERS = ["Contoso", "Fabrikam", "Northwind Traders", "Tailspin Toys", "Woodgrove Bank", "Adventure Works", "Litware", "Wingtip Toys"] as const;
const GH_LOGINS = ["priya-dev", "rahul-codes", "zara-ml", "kabir-ops", "arjun-k", "meera-ts", "dev-sharma", "ira-builds"] as const;
const GH_REPOS = ["vscode", "terminal", "PowerToys", "TypeScript", "winget-cli"] as const;

export const COMPANY_MICROSOFT: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "microsoft-dev-vms-billing-over-the-weekend",
    title: "Microsoft: Dev and Test VMs Still Billing Over the Weekend",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "An Azure FinOps analyst runs a Friday-evening check for non-production virtual machines that will keep costing money until Monday morning — a 60-hour weekend.",
      "",
      "A VM keeps billing for compute while it is `running`, and also while it is `stopped` from inside the guest OS: only a `deallocated` VM stops billing. Return every VM in the `dev` or `test` environment that **is still billing** and has **no auto-shutdown schedule** (`auto_shutdown = 0`). Return `vm_name`, `environment` and `weekend_cost` (`hourly_cost` × 60, rounded to 2 decimals), ordered by `weekend_cost` descending, then `vm_name` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "VirtualMachine",
        columns: [
          { name: "vm_id", type: "int" },
          { name: "vm_name", type: "varchar" },
          { name: "environment", type: "enum", values: ["prod", "dev", "test"] },
          { name: "power_state", type: "enum", values: ["running", "stopped", "deallocated"] },
          { name: "auto_shutdown", type: "bool" },
          { name: "hourly_cost", type: "decimal" },
        ],
        primaryKey: ["vm_id"],
        note: "One row per VM as of Friday 20:00. `hourly_cost` is the pay-as-you-go compute rate in US dollars; `vm_name` is unique.",
      },
    ],
    examples: [
      {
        VirtualMachine: [
          [1, "vm-dev-build-01", "dev", "running", 0, 0.192],
          [2, "vm-dev-sql-02", "dev", "stopped", 0, 0.384],
          [3, "vm-test-web-03", "test", "deallocated", 0, 0.096],
          [4, "vm-prod-api-04", "prod", "running", 0, 0.768],
          [5, "vm-test-ml-05", "test", "running", 1, 0.768],
          [6, "vm-dev-agent-06", "dev", "running", 0, 0.384],
          [7, "vm-test-load-07", "test", "running", 0, 0.208],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.04) ? 0 : ri(rng, 2, 16);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const env = pick(rng, ["dev", "dev", "test", "prod"] as const);
        return [
          id,
          `vm-${env}-${pick(rng, ["build", "sql", "web", "api", "ml", "agent"])}-${pad(id)}`,
          env,
          pick(rng, ["running", "running", "stopped", "deallocated"]),
          chance(rng, 0.3) ? 1 : 0,
          pick(rng, [0.096, 0.192, 0.384, 0.768, 0.208, 0.416]),
        ];
      });
      return { VirtualMachine: rows };
    },
    solution: [
      "SELECT vm_name, environment, ROUND(hourly_cost * 60, 2) AS weekend_cost",
      "FROM VirtualMachine",
      "WHERE environment IN ('dev', 'test')",
      "  AND power_state IN ('running', 'stopped')",
      "  AND auto_shutdown = 0",
      "ORDER BY weekend_cost DESC, vm_name",
    ].join("\n"),
    alternatives: [
      "SELECT vm_name, environment, ROUND(60 * hourly_cost, 2) AS weekend_cost FROM VirtualMachine WHERE environment <> 'prod' AND power_state <> 'deallocated' AND NOT auto_shutdown ORDER BY ROUND(60 * hourly_cost, 2) DESC, vm_name ASC",
    ],
    ordered: true,
    hints: [
      "Three conditions must all hold: the environment, the power state and the shutdown schedule.",
      "`stopped` is not the same as `deallocated` — only the latter stops the compute bill.",
      "The order has two keys; the VM name breaks ties between equal costs.",
    ],
    editorial: [
      "This is a filter plus a computed column. A VM belongs on the list when it is non-production (`environment IN ('dev', 'test')`), still billing, and has no auto-shutdown. The trap is the power state: Azure keeps charging for compute while a VM is merely `stopped` from inside the guest, so the billing states are `running` **and** `stopped`; only `deallocated` is safe. Writing `power_state = 'running'` would miss exactly the VMs people think they turned off.",
      "",
      "The weekend cost is the hourly rate times 60 hours, rounded to cents. The sort is fully specified — cost descending, then name — so two VMs with the same rate come out in a fixed order and the answer is deterministic.",
      "",
      "The alternative writes each condition as its negation (`<> 'prod'`, `<> 'deallocated'`, `NOT auto_shutdown`), which is equivalent because every column is an enum or a flag with no NULLs. It is a single scan of the table either way.",
    ].join("\n"),
  },

  {
    slug: "microsoft-teams-meetings-that-ran-over",
    title: "Microsoft: Teams Meetings That Ran Past Their Booked Slot",
    difficulty: "EASY",
    topics: ["Dates"],
    description: [
      "A Microsoft Teams product analyst studying meeting overload wants to know which meetings ran longer than the slot their organiser booked.",
      "",
      "For every meeting that has **ended** and lasted **strictly longer** than `booked_minutes`, return `meeting_id`, `organizer` and `overrun_minutes` — the minutes between `started_at` and `ended_at`, minus the booked minutes. Meetings still in progress have `ended_at` NULL and are left out. Order by `overrun_minutes` descending, then `meeting_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "TeamsMeeting",
        columns: [
          { name: "meeting_id", type: "int" },
          { name: "organizer", type: "varchar" },
          { name: "booked_minutes", type: "int" },
          { name: "started_at", type: "datetime" },
          { name: "ended_at", type: "datetime" },
        ],
        primaryKey: ["meeting_id"],
        note: "One row per scheduled meeting. Times are whole minutes; a meeting can run past midnight. `ended_at` is NULL while the meeting is still going.",
      },
    ],
    examples: [
      {
        TeamsMeeting: [
          [1, "Priya", 30, "2025-04-01 10:00:00", "2025-04-01 10:42:00"],
          [2, "Rahul", 60, "2025-04-01 11:00:00", "2025-04-01 12:00:00"],
          [3, "Zara", 30, "2025-04-01 14:00:00", null],
          [4, "Arjun", 45, "2025-04-02 09:05:00", "2025-04-02 09:41:00"],
          [5, "Meera", 15, "2025-04-02 16:00:00", "2025-04-02 16:27:00"],
          [6, "Kabir", 60, "2025-04-02 17:30:00", "2025-04-02 18:45:00"],
          [7, "Diya", 30, "2025-04-03 23:50:00", "2025-04-04 00:25:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 2, 14);
      const who = names(rng, 8);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const booked = pick(rng, [15, 30, 45, 60]);
        const day = dateBetween(rng, "2025-04-01", "2025-04-10");
        const start = ri(rng, 96, 286) * 5;
        const len = chance(rng, 0.25) ? booked : Math.max(1, booked + ri(rng, -15, 40));
        return [id, pick(rng, who), booked, at(day, start), chance(rng, 0.12) ? null : at(day, start + len)];
      });
      return { TeamsMeeting: rows };
    },
    solution: [
      "SELECT meeting_id, organizer,",
      "       TIMESTAMPDIFF(MINUTE, started_at, ended_at) - booked_minutes AS overrun_minutes",
      "FROM TeamsMeeting",
      "WHERE ended_at IS NOT NULL",
      "  AND TIMESTAMPDIFF(MINUTE, started_at, ended_at) > booked_minutes",
      "ORDER BY overrun_minutes DESC, meeting_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT meeting_id, organizer, overrun_minutes FROM (",
        "  SELECT meeting_id, organizer, TIMESTAMPDIFF(MINUTE, started_at, ended_at) - booked_minutes AS overrun_minutes FROM TeamsMeeting",
        ") t WHERE overrun_minutes > 0 ORDER BY overrun_minutes DESC, meeting_id ASC",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`TIMESTAMPDIFF(MINUTE, start, end)` gives the actual length in minutes, and it handles a meeting that crosses midnight.",
      "A meeting that lasted exactly its booked time did not run over.",
      "Arithmetic with a NULL `ended_at` is NULL, and a NULL comparison is never true.",
    ],
    editorial: [
      "The actual length of a meeting is `TIMESTAMPDIFF(MINUTE, started_at, ended_at)`; the overrun is that minus `booked_minutes`. Because the difference is computed on full timestamps, a meeting from 23:50 to 00:25 is 35 minutes long, not negative — working with the clock time alone would break there.",
      "",
      "The filter keeps overruns that are strictly positive: a meeting that ended exactly on time is not news. Meetings still running have `ended_at` NULL; the explicit `IS NOT NULL` documents that, and even without it the difference would be NULL and the comparison would drop the row.",
      "",
      "The alternative computes the overrun once in a derived table and filters on `overrun_minutes > 0`, which relies on that NULL behaviour. Either way it is one scan; the final sort puts the worst offenders first and breaks ties by id so the order is fixed.",
    ].join("\n"),
  },

  {
    slug: "microsoft-licensed-users-with-no-successful-sign-in",
    title: "Microsoft: Licensed Users With No Successful Sign-In",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "A Microsoft 365 licensing analyst is helping a customer reclaim paid licences from people who never actually got into their account.",
      "",
      "Return every user who **holds a licence** (any `licence_sku` other than `Unlicensed`) and has **no successful sign-in** in the log. Failed and MFA-denied attempts do not count as signing in. Return `user_id` and `upn`, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "M365User",
        columns: [
          { name: "user_id", type: "int" },
          { name: "upn", type: "varchar" },
          { name: "licence_sku", type: "enum", values: ["E3", "E5", "F3", "Unlicensed"] },
        ],
        primaryKey: ["user_id"],
        note: "One row per user in the tenant. `upn` is the user principal name they sign in with.",
      },
      {
        name: "SignInLog",
        columns: [
          { name: "sign_in_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "signed_in_at", type: "datetime" },
          { name: "outcome", type: "enum", values: ["success", "failure", "mfa_denied"] },
        ],
        primaryKey: ["sign_in_id"],
        note: "One row per sign-in attempt; `user_id` always names a user.",
      },
    ],
    examples: [
      {
        M365User: [
          [1, "priya@contoso.com", "E3"],
          [2, "rahul@contoso.com", "E5"],
          [3, "zara@contoso.com", "Unlicensed"],
          [4, "arjun@contoso.com", "F3"],
          [5, "meera@contoso.com", "E3"],
          [6, "kabir@contoso.com", "E5"],
        ],
        SignInLog: [
          [1, 1, "2025-05-02 09:10:00", "success"],
          [2, 2, "2025-05-02 09:12:00", "failure"],
          [3, 2, "2025-05-03 10:00:00", "mfa_denied"],
          [4, 4, "2025-05-03 08:00:00", "success"],
          [5, 3, "2025-05-04 11:00:00", "failure"],
          [6, 6, "2025-05-05 12:00:00", "failure"],
          [7, 6, "2025-05-05 12:02:00", "success"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const who = names(rng, n);
      const users: Cell[][] = who.map((name, i) => [i + 1, upnOf(name), pick(rng, ["E3", "E5", "F3", "Unlicensed"])]);
      const m = chance(rng, 0.08) ? 0 : ri(rng, 1, 18);
      const log: Cell[][] = seq(1, m).map((id) => [
        id,
        ri(rng, 1, n),
        atTime(rng, dateBetween(rng, "2025-05-01", "2025-05-31")),
        pick(rng, ["success", "failure", "failure", "mfa_denied"]),
      ]);
      return { M365User: users, SignInLog: log };
    },
    solution: [
      "SELECT u.user_id, u.upn",
      "FROM M365User u",
      "WHERE u.licence_sku <> 'Unlicensed'",
      "  AND NOT EXISTS (",
      "    SELECT 1 FROM SignInLog s",
      "    WHERE s.user_id = u.user_id AND s.outcome = 'success'",
      "  )",
    ].join("\n"),
    alternatives: [
      [
        "SELECT u.user_id, u.upn",
        "FROM M365User u",
        "LEFT JOIN SignInLog s ON s.user_id = u.user_id AND s.outcome = 'success'",
        "WHERE u.licence_sku <> 'Unlicensed' AND s.sign_in_id IS NULL",
      ].join("\n"),
      "SELECT user_id, upn FROM M365User WHERE licence_sku IN ('E3', 'E5', 'F3') AND user_id NOT IN (SELECT user_id FROM SignInLog WHERE outcome = 'success')",
    ],
    hints: [
      "This is an anti join: users for whom a certain kind of row does not exist.",
      "Only successful attempts matter — filter the log to `success` before asking whether a row exists.",
      "If you use a LEFT JOIN, the outcome condition has to go in `ON`, not in `WHERE`.",
    ],
    editorial: [
      "The question is about the **absence** of a row: a licensed user for whom no successful sign-in exists. `NOT EXISTS` says that directly — for each user, look for a log row with their id and `outcome = 'success'`, and keep the user if none is found. A user with only failures or MFA denials still passes, and so does a user with no log rows at all.",
      "",
      "The LEFT JOIN version is the classic trap. The condition `s.outcome = 'success'` must sit in the `ON` clause, so unsuccessful rows simply fail to match and the user gets a NULL-extended row; putting it in `WHERE` would throw away the users with failures only. Then `s.sign_in_id IS NULL` keeps the unmatched users.",
      "",
      "`NOT IN` works too here because `SignInLog.user_id` is never NULL. All three read each user once and probe the log by `user_id`, so an index on `(user_id, outcome)` makes them cheap.",
    ].join("\n"),
  },

  {
    slug: "microsoft-gamerscore-awarded-per-xbox-title",
    title: "Microsoft: Gamerscore Awarded per Xbox Title",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "An Xbox achievements analyst is reviewing how much Gamerscore each game has handed out to players.",
      "",
      "For **every title** in the catalogue, return `title_name`, `unlocks` (the number of achievement unlocks for the title) and `gamerscore_awarded` (the sum of the Gamerscore of those unlocks). A title with no achievements, or none unlocked yet, appears with `0` in both columns. Order by `gamerscore_awarded` descending, then `title_name` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "XboxTitle",
        columns: [
          { name: "title_id", type: "int" },
          { name: "title_name", type: "varchar" },
        ],
        primaryKey: ["title_id"],
        note: "One row per game; `title_name` is unique.",
      },
      {
        name: "Achievement",
        columns: [
          { name: "achievement_id", type: "int" },
          { name: "title_id", type: "int" },
          { name: "gamerscore", type: "int" },
        ],
        primaryKey: ["achievement_id"],
        note: "One row per achievement a title offers, with the Gamerscore it is worth.",
      },
      {
        name: "AchievementUnlock",
        columns: [
          { name: "gamertag", type: "varchar" },
          { name: "achievement_id", type: "int" },
          { name: "unlocked_at", type: "datetime" },
        ],
        primaryKey: ["gamertag", "achievement_id"],
        note: "One row per player per achievement they unlocked.",
      },
    ],
    examples: [
      {
        XboxTitle: [
          [1, "Forza Horizon 5"],
          [2, "Halo Infinite"],
          [3, "Starfield"],
          [4, "Sea of Thieves"],
        ],
        Achievement: [
          [101, 1, 10],
          [102, 1, 50],
          [103, 2, 20],
          [104, 2, 100],
          [105, 3, 15],
        ],
        AchievementUnlock: [
          ["ShadowKabir", 101, "2025-02-01 18:00:00"],
          ["ShadowKabir", 102, "2025-02-03 21:30:00"],
          ["PixelPriya", 101, "2025-02-04 20:00:00"],
          ["PixelPriya", 103, "2025-02-05 22:15:00"],
          ["NovaRiya", 104, "2025-02-06 19:45:00"],
        ],
      },
    ],
    gen: (rng) => {
      const titles: Cell[][] = sample(rng, XBOX_TITLES, ri(rng, 1, 5)).map((t, i) => [i + 1, t]);
      const na = ri(rng, 0, 12);
      const ach: Cell[][] = seq(101, na).map((id) => [id, ri(rng, 1, titles.length), pick(rng, [5, 10, 15, 20, 25, 50, 100])]);
      const unlocks: Cell[][] = [];
      for (const g of sample(rng, GAMERTAGS, ri(rng, 1, 6))) {
        for (const a of ach) if (chance(rng, 0.35)) unlocks.push([g, a[0]!, atTime(rng, dateBetween(rng, "2025-01-01", "2025-03-31"))]);
      }
      return { XboxTitle: titles, Achievement: ach, AchievementUnlock: unlocks };
    },
    solution: [
      "SELECT t.title_name,",
      "       COUNT(u.gamertag) AS unlocks,",
      "       COALESCE(SUM(CASE WHEN u.gamertag IS NOT NULL THEN a.gamerscore END), 0) AS gamerscore_awarded",
      "FROM XboxTitle t",
      "LEFT JOIN Achievement a ON a.title_id = t.title_id",
      "LEFT JOIN AchievementUnlock u ON u.achievement_id = a.achievement_id",
      "GROUP BY t.title_id, t.title_name",
      "ORDER BY gamerscore_awarded DESC, t.title_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT t.title_name,",
        "  (SELECT COUNT(*) FROM AchievementUnlock u JOIN Achievement a ON a.achievement_id = u.achievement_id WHERE a.title_id = t.title_id) AS unlocks,",
        "  (SELECT COALESCE(SUM(a.gamerscore), 0) FROM AchievementUnlock u JOIN Achievement a ON a.achievement_id = u.achievement_id WHERE a.title_id = t.title_id) AS gamerscore_awarded",
        "FROM XboxTitle t",
        "ORDER BY gamerscore_awarded DESC, title_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Every title must appear, so start from `XboxTitle` and use LEFT JOINs.",
      "`COUNT(column)` skips NULLs, so counting a column of the unlock table counts only real unlocks.",
      "An achievement nobody unlocked still joins with a non-NULL Gamerscore — only add it when an unlock is present, and turn a NULL sum into 0.",
    ],
    editorial: [
      "Each title must appear even when it has nothing to report, so the query starts from `XboxTitle` and LEFT JOINs down the chain: title → achievements → unlocks. A title with no achievements keeps one row of NULLs; an achievement no one unlocked keeps one row with the unlock columns NULL.",
      "",
      "That second case is why the sum is conditional. The row of an unlocked-by-nobody achievement still carries its `gamerscore`, so a plain `SUM(a.gamerscore)` would award points nobody earned. Summing only where `u.gamertag IS NOT NULL` fixes it, and `COALESCE(…, 0)` turns the empty sum (NULL) into 0. `COUNT(u.gamertag)` likewise counts only real unlocks.",
      "",
      "The alternative uses two correlated subqueries per title — easier to read, but it scans the unlocks twice per title; the join version does one pass with a GROUP BY.",
    ].join("\n"),
  },

  {
    slug: "microsoft-outlook-mailboxes-near-quota",
    title: "Microsoft: Outlook Mailboxes at 90% of Their Quota or More",
    difficulty: "EASY",
    topics: ["Basics", "Conditional Logic"],
    description: [
      "An Exchange Online admin sends a warning to every mailbox that is about to stop receiving mail because it is nearly full.",
      "",
      "Return each **user or shared** mailbox (room mailboxes are managed separately) whose `used_mb` is **at least 90%** of its `quota_mb`. Return `owner_upn` and `free_mb` (quota minus used; negative when the mailbox is already over quota), ordered by `free_mb` ascending, then `owner_upn` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Mailbox",
        columns: [
          { name: "mailbox_id", type: "int" },
          { name: "owner_upn", type: "varchar" },
          { name: "mailbox_type", type: "enum", values: ["user", "shared", "room"] },
          { name: "quota_mb", type: "int" },
          { name: "used_mb", type: "int" },
        ],
        primaryKey: ["mailbox_id"],
        note: "One row per mailbox; `owner_upn` is unique. Sizes are in megabytes.",
      },
    ],
    examples: [
      {
        Mailbox: [
          [1, "priya@contoso.com", "user", 51200, 46080],
          [2, "rahul@contoso.com", "user", 51200, 46079],
          [3, "helpdesk@contoso.com", "shared", 51200, 50900],
          [4, "boardroom@contoso.com", "room", 10240, 10000],
          [5, "zara@contoso.com", "user", 102400, 103000],
          [6, "kabir@contoso.com", "user", 102400, 20000],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const rows: Cell[][] = names(rng, n).map((name, i) => {
        const quota = pick(rng, [10240, 51200, 102400]);
        const r = rng();
        const used = r < 0.2 ? (quota * 9) / 10 : r < 0.3 ? (quota * 9) / 10 - 1 : ri(rng, quota / 2, Math.floor((quota * 21) / 20));
        return [i + 1, upnOf(name), pick(rng, ["user", "user", "shared", "room"]), quota, used];
      });
      return { Mailbox: rows };
    },
    solution: [
      "SELECT owner_upn, quota_mb - used_mb AS free_mb",
      "FROM Mailbox",
      "WHERE mailbox_type IN ('user', 'shared')",
      "  AND used_mb * 10 >= quota_mb * 9",
      "ORDER BY free_mb, owner_upn",
    ].join("\n"),
    alternatives: [
      "SELECT owner_upn, quota_mb - used_mb AS free_mb FROM Mailbox WHERE mailbox_type <> 'room' AND quota_mb - used_mb <= quota_mb / 10 ORDER BY quota_mb - used_mb ASC, owner_upn ASC",
    ],
    ordered: true,
    hints: [
      "\"At least 90%\" includes a mailbox at exactly 90%.",
      "Compare with integers — `used_mb * 10 >= quota_mb * 9` — and no rounding can move the boundary.",
      "Free space is a plain subtraction, and it may be negative.",
    ],
    editorial: [
      "Two conditions pick the mailboxes: the type is `user` or `shared`, and usage is at least nine tenths of the quota. Writing the second as `used_mb * 10 >= quota_mb * 9` keeps everything in integers, so a mailbox at exactly 90% (46,080 of 51,200 MB) is kept and one a single megabyte below is not — a comparison through a floating-point ratio can wobble on that boundary.",
      "",
      "`free_mb` is `quota_mb - used_mb`. Exchange lets a mailbox pass its quota briefly, so the value can be negative, and those mailboxes sort first under the ascending order — exactly the ones the admin should call first. Ties on free space are broken by the unique UPN.",
      "",
      "The alternative restates the threshold as \"free space is at most a tenth of the quota\", which is the same inequality rearranged; every quota is a multiple of ten so the division is exact. One scan of the table.",
    ].join("\n"),
  },

  {
    slug: "microsoft-azure-resources-per-resource-group",
    title: "Microsoft: Azure Resource Count per Resource Group From Resource IDs",
    difficulty: "EASY",
    topics: ["Strings", "Aggregation"],
    description: [
      "An Azure governance engineer has an inventory export with only the full resource ID of each resource, and wants to know how many resources live in each resource group.",
      "",
      "A resource ID looks like `/subscriptions/<subscription>/resourceGroups/<group>/providers/<namespace>/<type>/<name>`. Return `subscription_id`, `resource_group` and `resources` (how many resources the group holds). The same group name in two subscriptions is **two different groups**. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "AzureResource",
        columns: [
          { name: "resource_id", type: "varchar" },
          { name: "location", type: "varchar" },
          { name: "created_on", type: "date" },
        ],
        primaryKey: ["resource_id"],
        note: "One row per resource. Every `resource_id` follows the format above, with `resourceGroups` always spelled exactly that way.",
      },
    ],
    examples: [
      {
        AzureResource: [
          ["/subscriptions/sub-prod-01/resourceGroups/rg-web/providers/Microsoft.Web/sites/app-store", "centralindia", "2025-01-12"],
          ["/subscriptions/sub-prod-01/resourceGroups/rg-web/providers/Microsoft.Network/frontDoors/fd-store", "global", "2025-01-12"],
          ["/subscriptions/sub-prod-01/resourceGroups/rg-data/providers/Microsoft.Sql/servers/sql-orders", "centralindia", "2025-01-20"],
          ["/subscriptions/sub-dev-02/resourceGroups/rg-web/providers/Microsoft.Web/sites/app-store-dev", "southindia", "2025-02-02"],
          ["/subscriptions/sub-dev-02/resourceGroups/rg-web/providers/Microsoft.Storage/storageAccounts/stdevassets", "southindia", "2025-02-03"],
          ["/subscriptions/sub-dev-02/resourceGroups/rg-ml/providers/Microsoft.Compute/virtualMachines/vm-gpu-01", "eastus", "2025-02-10"],
        ],
      },
    ],
    gen: (rng) => {
      const subs = sample(rng, ["sub-prod-01", "sub-dev-02", "sub-test-03", "sub-shared-04"], ri(rng, 1, 3));
      const rgs = sample(rng, ["rg-web", "rg-data", "rg-ml", "rg-network", "rg-identity"], ri(rng, 1, 4));
      const kinds = [["Microsoft.Web", "sites", "app"], ["Microsoft.Sql", "servers", "sql"], ["Microsoft.Storage", "storageAccounts", "st"], ["Microsoft.Compute", "virtualMachines", "vm"], ["Microsoft.Network", "virtualNetworks", "vnet"]] as const;
      const n = ri(rng, 1, 20);
      const rows: Cell[][] = seq(1, n).map((i) => {
        const [ns, type, prefix] = pick(rng, kinds);
        return [
          `/subscriptions/${pick(rng, subs)}/resourceGroups/${pick(rng, rgs)}/providers/${ns}/${type}/${prefix}-${pad(i)}`,
          pick(rng, ["centralindia", "southindia", "eastus", "westeurope"]),
          dateBetween(rng, "2025-01-01", "2025-06-30"),
        ];
      });
      return { AzureResource: rows };
    },
    solution: [
      "SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(resource_id, '/', 3), '/', -1) AS subscription_id,",
      "       SUBSTRING_INDEX(SUBSTRING_INDEX(resource_id, '/', 5), '/', -1) AS resource_group,",
      "       COUNT(*) AS resources",
      "FROM AzureResource",
      "GROUP BY subscription_id, resource_group",
    ].join("\n"),
    alternatives: [
      [
        "SELECT sub AS subscription_id, rg AS resource_group, COUNT(*) AS resources",
        "FROM (",
        "  SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(resource_id, '/subscriptions/', -1), '/', 1) AS sub,",
        "         SUBSTRING_INDEX(SUBSTRING_INDEX(resource_id, '/resourceGroups/', -1), '/', 1) AS rg",
        "  FROM AzureResource",
        ") p",
        "GROUP BY sub, rg",
      ].join("\n"),
    ],
    hints: [
      "The ID is a path: split it on `/` and pick the right segments.",
      "`SUBSTRING_INDEX(s, '/', n)` keeps everything before the n-th slash; `SUBSTRING_INDEX(…, '/', -1)` then keeps the last piece.",
      "Group by both the subscription and the group name, or `rg-web` in two subscriptions would be merged.",
    ],
    editorial: [
      "The resource ID is a path with a fixed shape, so the subscription and the resource group sit at fixed positions: the string starts with a slash, so the segments are `''`, `subscriptions`, the subscription, `resourceGroups`, the group. `SUBSTRING_INDEX(resource_id, '/', 3)` keeps everything up to the third slash — `/subscriptions/sub-prod-01` — and `SUBSTRING_INDEX(…, '/', -1)` takes its last segment. The same trick with 5 gives the group.",
      "",
      "Once both are columns, it is an ordinary GROUP BY with `COUNT(*)`. Grouping by the pair matters: resource-group names are only unique inside a subscription, so `rg-web` in production and in dev are different groups.",
      "",
      "The alternative anchors on the literal markers instead of counting slashes: take what follows `/resourceGroups/` up to the next slash. It is more robust if an ID ever had an extra leading segment. Both are one scan with string work per row.",
    ].join("\n"),
  },

  {
    slug: "microsoft-products-with-three-severity-a-cases-in-march",
    title: "Microsoft: Products With Three or More Severity A Cases in March",
    difficulty: "EASY",
    topics: ["Aggregation", "Dates"],
    description: [
      "A Microsoft support operations manager is preparing a monthly review of the products generating the most critical (Severity A) support cases.",
      "",
      "Count the **Severity A** cases **opened in March 2025** for each product, ignoring cases closed as duplicates (`closed_duplicate`). Return `product` and `sev_a_cases` for products with **at least 3** such cases, ordered by `sev_a_cases` descending, then `product` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "SupportCase",
        columns: [
          { name: "case_id", type: "int" },
          { name: "product", type: "varchar" },
          { name: "severity", type: "enum", values: ["A", "B", "C"] },
          { name: "opened_at", type: "datetime" },
          { name: "status", type: "enum", values: ["open", "resolved", "closed_duplicate"] },
        ],
        primaryKey: ["case_id"],
        note: "One row per support case. Severity A is the most critical level.",
      },
    ],
    examples: [
      {
        SupportCase: [
          [1, "Azure Kubernetes Service", "A", "2025-03-01 00:00:00", "resolved"],
          [2, "Azure Kubernetes Service", "A", "2025-03-10 12:00:00", "open"],
          [3, "Azure Kubernetes Service", "A", "2025-03-31 23:59:59", "resolved"],
          [4, "Azure Kubernetes Service", "A", "2025-04-01 00:00:00", "open"],
          [5, "Exchange Online", "A", "2025-03-05 09:00:00", "resolved"],
          [6, "Exchange Online", "A", "2025-03-06 09:00:00", "closed_duplicate"],
          [7, "Exchange Online", "A", "2025-03-07 09:00:00", "open"],
          [8, "Exchange Online", "B", "2025-03-08 09:00:00", "open"],
          [9, "Exchange Online", "A", "2025-02-28 23:59:59", "open"],
          [10, "Microsoft Teams", "A", "2025-03-12 10:00:00", "resolved"],
          [11, "Microsoft Teams", "A", "2025-03-15 14:30:00", "resolved"],
          [12, "Microsoft Teams", "A", "2025-03-20 08:15:00", "open"],
        ],
      },
    ],
    gen: (rng) => {
      const products = sample(rng, ["Azure Kubernetes Service", "Exchange Online", "Microsoft Teams", "Azure SQL Database", "Microsoft Intune"], ri(rng, 2, 3));
      const n = ri(rng, 8, 25);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        pick(rng, products),
        chance(rng, 0.7) ? "A" : pick(rng, ["B", "C"]),
        chance(rng, 0.2)
          ? pick(rng, ["2025-03-01 00:00:00", "2025-03-31 23:59:59", "2025-02-28 23:59:59", "2025-04-01 00:00:00"])
          : atTime(rng, dateBetween(rng, "2025-02-25", "2025-04-05")),
        chance(rng, 0.1) ? "closed_duplicate" : pick(rng, ["open", "resolved"]),
      ]);
      return { SupportCase: rows };
    },
    solution: [
      "SELECT product, COUNT(*) AS sev_a_cases",
      "FROM SupportCase",
      "WHERE severity = 'A'",
      "  AND status <> 'closed_duplicate'",
      "  AND opened_at >= '2025-03-01' AND opened_at < '2025-04-01'",
      "GROUP BY product",
      "HAVING COUNT(*) >= 3",
      "ORDER BY sev_a_cases DESC, product",
    ].join("\n"),
    alternatives: [
      [
        "SELECT product, SUM(CASE WHEN severity = 'A' AND status <> 'closed_duplicate' AND YEAR(opened_at) = 2025 AND MONTH(opened_at) = 3 THEN 1 ELSE 0 END) AS sev_a_cases",
        "FROM SupportCase",
        "GROUP BY product",
        "HAVING sev_a_cases >= 3",
        "ORDER BY sev_a_cases DESC, product ASC",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Filter the rows first (severity, status, month), then group by product.",
      "A half-open range — from 1 March inclusive to 1 April exclusive — catches 23:59:59 on the 31st without catching 1 April.",
      "A condition on a count belongs in `HAVING`, not `WHERE`.",
    ],
    editorial: [
      "Row filters come first: Severity A, not a duplicate, opened in March 2025. For the month the safest test is the half-open range `opened_at >= '2025-03-01' AND opened_at < '2025-04-01'` — it keeps a case opened at 23:59:59 on 31 March and drops one opened at midnight on 1 April, with no reasoning about times. `BETWEEN '2025-03-01' AND '2025-03-31'` would quietly lose most of the 31st, since a timestamp later that day is greater than the bare date.",
      "",
      "Then `GROUP BY product` and `HAVING COUNT(*) >= 3`: the threshold is about the group, so it cannot go in `WHERE`. The order is fully specified, with the product name breaking ties between equal counts.",
      "",
      "The alternative counts conditionally over all rows with `SUM(CASE …)` and `YEAR`/`MONTH`. It gives the same answer, but it cannot use an index on `opened_at`, so on a large case table the range filter is cheaper.",
    ].join("\n"),
  },

  {
    slug: "microsoft-azure-subscription-budget-status",
    title: "Microsoft: Azure Subscription Budget Status This Month",
    difficulty: "EASY",
    topics: ["Conditional Logic"],
    description: [
      "A cloud cost-management dashboard shows each Azure subscription's month-to-date spend against the budget its owner set.",
      "",
      "Return `display_name` and `budget_status` for every subscription, where the status is: `No budget` when `monthly_budget` is NULL; otherwise `Over budget` when the month-to-date cost is **strictly above** the budget; `At risk` when it is **at least 80%** of the budget; and `On track` below that. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "AzureSubscription",
        columns: [
          { name: "subscription_id", type: "int" },
          { name: "display_name", type: "varchar" },
          { name: "monthly_budget", type: "int" },
          { name: "month_to_date_cost", type: "decimal" },
        ],
        primaryKey: ["subscription_id"],
        note: "One row per subscription. `monthly_budget` is NULL when no budget has been set; amounts are in US dollars.",
      },
    ],
    examples: [
      {
        AzureSubscription: [
          [1, "Contoso Prod", 5000, 6200.5],
          [2, "Contoso Dev", 1000, 800],
          [3, "Contoso Test", 1000, 799.75],
          [4, "Data Science Sandbox", null, 350.25],
          [5, "Shared Networking", 2000, 2000],
          [6, "Marketing Site", 1500, 120],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const subNames = sample(rng, ["Contoso Prod", "Contoso Dev", "Contoso Test", "Data Science Sandbox", "Shared Networking", "Marketing Site", "Identity Hub", "Analytics Lake", "Partner Portal", "Edge Gateway", "Backup Vault", "Build Agents"], n);
      const rows: Cell[][] = subNames.map((name, i) => {
        const budget = chance(rng, 0.15) ? null : pick(rng, [500, 1000, 1500, 2000, 5000]);
        const base = budget ?? 4000;
        const r = rng();
        const cost = budget !== null && r < 0.15 ? (budget * 4) / 5 : budget !== null && r < 0.25 ? budget : ri(rng, 0, Math.floor(base * 1.4 * 4)) / 4;
        return [i + 1, name, budget, cost];
      });
      return { AzureSubscription: rows };
    },
    solution: [
      "SELECT display_name,",
      "       CASE",
      "         WHEN monthly_budget IS NULL THEN 'No budget'",
      "         WHEN month_to_date_cost > monthly_budget THEN 'Over budget'",
      "         WHEN month_to_date_cost * 5 >= monthly_budget * 4 THEN 'At risk'",
      "         ELSE 'On track'",
      "       END AS budget_status",
      "FROM AzureSubscription",
    ].join("\n"),
    alternatives: [
      "SELECT display_name, IF(monthly_budget IS NULL, 'No budget', IF(month_to_date_cost > monthly_budget, 'Over budget', IF(month_to_date_cost / monthly_budget >= 0.8, 'At risk', 'On track'))) AS budget_status FROM AzureSubscription",
    ],
    hints: [
      "A `CASE` takes the first branch that is true, so the order of the branches is the order of precedence.",
      "Deal with the NULL budget first — any comparison with NULL is unknown, and would fall through to `ELSE`.",
      "Exactly 80% is at risk, and spending exactly the budget is not over it.",
    ],
    editorial: [
      "A searched `CASE` evaluates its branches top to bottom and returns the first true one, so precedence is just the order they are written in. The NULL budget must be checked first: `month_to_date_cost > NULL` is unknown, not false, and without the explicit test a subscription with no budget would slide down to `On track` — a misleading label for something nobody is watching.",
      "",
      "Then over budget (strictly greater), then at risk (at least 80%), and everything else is on track. Spending exactly the budget is `At risk`, not over. Writing the 80% test as `cost * 5 >= budget * 4` avoids a decimal threshold; the alternative's `cost / budget >= 0.8` agrees here because 800/1000 rounds to the same double as the literal 0.8.",
      "",
      "The alternative nests `IF` calls, which is MySQL shorthand for the same decision ladder. One scan.",
    ].join("\n"),
  },

  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "microsoft-azure-q1-cost-by-service-family",
    title: "Microsoft: Azure Q1 Cost Split by Service Family per Month",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Conditional Logic", "Dates"],
    description: [
      "An Azure FinOps lead wants one row per month of Q1 2025 showing where the cloud bill went, split into three service families.",
      "",
      "Map each usage record's `meter_category` to a family: **compute** = `Virtual Machines` or `Azure Kubernetes Service`; **data** = `Storage` or `SQL Database`; **other** = every other category. For each month of **January–March 2025** that has any usage, return `usage_month` (as `'YYYY-MM'`), `compute_cost`, `data_cost`, `other_cost` and `total_cost`, each rounded to 2 decimals (`0` when the family has no usage that month). Order by `usage_month`.",
    ].join("\n"),
    tables: [
      {
        name: "AzureUsage",
        columns: [
          { name: "usage_id", type: "int" },
          { name: "subscription_id", type: "varchar" },
          { name: "usage_date", type: "date" },
          { name: "meter_category", type: "varchar" },
          { name: "cost", type: "decimal" },
        ],
        primaryKey: ["usage_id"],
        note: "One row per daily usage record from the cost export; `cost` is in US dollars.",
      },
    ],
    examples: [
      {
        AzureUsage: [
          [1, "sub-prod-01", "2024-12-31", "Virtual Machines", 410.0],
          [2, "sub-prod-01", "2025-01-01", "Virtual Machines", 120.5],
          [3, "sub-prod-01", "2025-01-15", "Storage", 35.25],
          [4, "sub-dev-02", "2025-01-31", "Bandwidth", 12.4],
          [5, "sub-dev-02", "2025-02-10", "Azure Kubernetes Service", 260.0],
          [6, "sub-prod-01", "2025-02-28", "Virtual Machines", 99.99],
          [7, "sub-prod-01", "2025-03-03", "SQL Database", 150.0],
          [8, "sub-dev-02", "2025-03-20", "Azure Monitor", 8.75],
          [9, "sub-prod-01", "2025-04-01", "Storage", 44.0],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.03) ? 0 : ri(rng, 3, 25);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        pick(rng, ["sub-prod-01", "sub-dev-02", "sub-data-03"]),
        chance(rng, 0.1) ? pick(rng, ["2024-12-31", "2025-01-01", "2025-03-31", "2025-04-01"]) : dateBetween(rng, "2024-12-20", "2025-04-10"),
        pick(rng, ["Virtual Machines", "Azure Kubernetes Service", "Storage", "SQL Database", "Bandwidth", "Azure Monitor"]),
        ri(rng, 100, 60000) / 100,
      ]);
      return { AzureUsage: rows };
    },
    solution: [
      "SELECT DATE_FORMAT(usage_date, '%Y-%m') AS usage_month,",
      "       ROUND(SUM(CASE WHEN meter_category IN ('Virtual Machines', 'Azure Kubernetes Service') THEN cost ELSE 0 END), 2) AS compute_cost,",
      "       ROUND(SUM(CASE WHEN meter_category IN ('Storage', 'SQL Database') THEN cost ELSE 0 END), 2) AS data_cost,",
      "       ROUND(SUM(CASE WHEN meter_category NOT IN ('Virtual Machines', 'Azure Kubernetes Service', 'Storage', 'SQL Database') THEN cost ELSE 0 END), 2) AS other_cost,",
      "       ROUND(SUM(cost), 2) AS total_cost",
      "FROM AzureUsage",
      "WHERE usage_date >= '2025-01-01' AND usage_date < '2025-04-01'",
      "GROUP BY usage_month",
      "ORDER BY usage_month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT usage_month,",
        "       ROUND(SUM(IF(family = 'compute', cost, 0)), 2) AS compute_cost,",
        "       ROUND(SUM(IF(family = 'data', cost, 0)), 2) AS data_cost,",
        "       ROUND(SUM(IF(family = 'other', cost, 0)), 2) AS other_cost,",
        "       ROUND(SUM(cost), 2) AS total_cost",
        "FROM (",
        "  SELECT LEFT(usage_date, 7) AS usage_month, cost,",
        "         CASE meter_category WHEN 'Virtual Machines' THEN 'compute' WHEN 'Azure Kubernetes Service' THEN 'compute'",
        "              WHEN 'Storage' THEN 'data' WHEN 'SQL Database' THEN 'data' ELSE 'other' END AS family",
        "  FROM AzureUsage",
        "  WHERE YEAR(usage_date) = 2025 AND QUARTER(usage_date) = 1",
        ") u",
        "GROUP BY usage_month",
        "ORDER BY usage_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "One output row per month means `GROUP BY` the month label; the three families become three columns.",
      "`SUM(CASE WHEN <family> THEN cost ELSE 0 END)` adds up one family and gives 0 when it has nothing.",
      "Restrict to Q1 2025 before grouping, so December and April usage cannot sneak in.",
    ],
    editorial: [
      "This is a **pivot**: the rows are months and the columns are families. Group by the month label (`DATE_FORMAT(usage_date, '%Y-%m')`), and turn each family into a column with conditional aggregation — `SUM(CASE WHEN <category is in the family> THEN cost ELSE 0 END)`. The `ELSE 0` matters: it makes a family with no usage in a month show `0` instead of NULL, as the statement asks.",
      "",
      "The \"other\" bucket is the complement of the two named families, written with `NOT IN`; `meter_category` is never NULL, so the complement is exact and the three columns always add up to the total. The quarter filter runs in `WHERE`, before grouping, so a month outside Q1 never forms a group, and a month with no usage at all simply does not appear.",
      "",
      "The alternative maps each record to a family in a derived table first (with a simple `CASE`) and pivots on the family name with `IF` — handy when the mapping is reused. Both are one scan.",
    ].join("\n"),
  },

  {
    slug: "microsoft-teams-channels-where-guests-post-most",
    title: "Microsoft: Teams Channels Where Guests Post Most Messages",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "A Microsoft 365 compliance analyst reviewing external collaboration wants the Teams channels that are effectively run by guests from other organisations.",
      "",
      "Counting only messages that are **not deleted**, return every channel where messages sent by `Guest` users are **more than half** of the channel's messages. Return `team_name`, `channel_name`, `guest_messages` and `total_messages`, in any order. A channel with no live messages is not in the answer.",
    ].join("\n"),
    tables: [
      {
        name: "TenantUser",
        columns: [
          { name: "user_id", type: "int" },
          { name: "display_name", type: "varchar" },
          { name: "user_type", type: "enum", values: ["Member", "Guest"] },
        ],
        primaryKey: ["user_id"],
        note: "One row per account in the tenant; guests are invited from other organisations.",
      },
      {
        name: "TeamsChannel",
        columns: [
          { name: "channel_id", type: "int" },
          { name: "team_name", type: "varchar" },
          { name: "channel_name", type: "varchar" },
        ],
        primaryKey: ["channel_id"],
        note: "One row per channel.",
      },
      {
        name: "ChannelMessage",
        columns: [
          { name: "message_id", type: "int" },
          { name: "channel_id", type: "int" },
          { name: "sender_id", type: "int" },
          { name: "sent_at", type: "datetime" },
          { name: "is_deleted", type: "bool" },
        ],
        primaryKey: ["message_id"],
        note: "One row per channel post; `sender_id` is a `TenantUser.user_id`.",
      },
    ],
    examples: [
      {
        TenantUser: [
          [1, "Priya", "Member"],
          [2, "Rahul", "Member"],
          [3, "Alex (Fabrikam)", "Guest"],
          [4, "Maria (Fabrikam)", "Guest"],
          [5, "John (Northwind)", "Guest"],
        ],
        TeamsChannel: [
          [10, "Project Falcon", "General"],
          [11, "Project Falcon", "Vendor Sync"],
          [12, "Finance", "Month-End Close"],
          [13, "Partners", "Onboarding"],
        ],
        ChannelMessage: [
          [1, 10, 1, "2025-06-02 09:00:00", 0],
          [2, 10, 3, "2025-06-02 09:05:00", 0],
          [3, 11, 3, "2025-06-02 10:00:00", 0],
          [4, 11, 4, "2025-06-02 10:02:00", 0],
          [5, 11, 2, "2025-06-02 10:10:00", 0],
          [6, 11, 5, "2025-06-02 10:15:00", 0],
          [7, 11, 1, "2025-06-02 10:20:00", 1],
          [8, 12, 1, "2025-06-03 11:00:00", 0],
          [9, 13, 4, "2025-06-03 12:00:00", 0],
          [10, 13, 5, "2025-06-03 12:01:00", 0],
          [11, 13, 2, "2025-06-03 12:05:00", 0],
          [12, 13, 1, "2025-06-03 12:06:00", 1],
          [13, 13, 2, "2025-06-03 12:07:00", 1],
        ],
      },
    ],
    gen: (rng) => {
      const nu = ri(rng, 2, 8);
      const users: Cell[][] = names(rng, nu).map((name, i) => [i + 1, name, i === 0 ? "Member" : i === 1 ? "Guest" : pick(rng, ["Member", "Guest"])]);
      const guests = users.filter((u) => u[2] === "Guest").map((u) => u[0] as number);
      const members = users.filter((u) => u[2] === "Member").map((u) => u[0] as number);
      const teams = ["Project Falcon", "Finance", "Partners", "Azure Migration"];
      const chans = ["General", "Vendor Sync", "Onboarding", "Escalations", "Design"];
      const nc = ri(rng, 1, 5);
      const channels: Cell[][] = seq(10, nc).map((id) => [id, pick(rng, teams), chans[(id - 10) % chans.length]!]);
      const pref = new Map(channels.map((c) => [c[0] as number, rng()]));
      const nm = chance(rng, 0.04) ? 0 : ri(rng, 4, 30);
      const msgs: Cell[][] = seq(1, nm).map((id) => {
        const ch = ri(rng, 10, 9 + nc);
        const sender = rng() < pref.get(ch)! ? pick(rng, guests) : pick(rng, members);
        return [id, ch, sender, atTime(rng, dateBetween(rng, "2025-06-01", "2025-06-30")), chance(rng, 0.2) ? 1 : 0];
      });
      return { TenantUser: users, TeamsChannel: channels, ChannelMessage: msgs };
    },
    solution: [
      "SELECT c.team_name, c.channel_name,",
      "       SUM(CASE WHEN u.user_type = 'Guest' THEN 1 ELSE 0 END) AS guest_messages,",
      "       COUNT(*) AS total_messages",
      "FROM ChannelMessage m",
      "JOIN TeamsChannel c ON c.channel_id = m.channel_id",
      "JOIN TenantUser u ON u.user_id = m.sender_id",
      "WHERE m.is_deleted = 0",
      "GROUP BY c.channel_id, c.team_name, c.channel_name",
      "HAVING SUM(CASE WHEN u.user_type = 'Guest' THEN 1 ELSE 0 END) * 2 > COUNT(*)",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.team_name, c.channel_name, t.guest_messages, t.total_messages",
        "FROM TeamsChannel c",
        "JOIN (",
        "  SELECT m.channel_id,",
        "         COUNT(CASE WHEN m.sender_id IN (SELECT user_id FROM TenantUser WHERE user_type = 'Guest') THEN 1 END) AS guest_messages,",
        "         COUNT(*) AS total_messages",
        "  FROM ChannelMessage m",
        "  WHERE NOT m.is_deleted",
        "  GROUP BY m.channel_id",
        ") t ON t.channel_id = c.channel_id",
        "WHERE t.guest_messages > t.total_messages / 2",
      ].join("\n"),
    ],
    hints: [
      "Join each message to its sender to learn whether a guest wrote it, and drop deleted messages first.",
      "Count guests and all messages in the same GROUP BY with a conditional sum.",
      "\"More than half\" is strict: `guests * 2 > total` avoids a fraction and excludes an exact 50/50 split.",
    ],
    editorial: [
      "Each message needs one fact from another table — whether its sender is a guest — so join `ChannelMessage` to `TenantUser`, and to `TeamsChannel` for the names. Deleted messages are filtered out in `WHERE` before anything is counted, which changes answers: a channel with two guest posts and one live member post is guest-dominated even if the members also posted and then deleted two more.",
      "",
      "Per channel, `COUNT(*)` is the live total and `SUM(CASE WHEN user_type = 'Guest' THEN 1 ELSE 0 END)` the guest part. The condition is on the group, so it goes in `HAVING`, written as `guests * 2 > total` — strictly more than half, so an even split is out, and no division is needed. Channels without live messages produce no group and are absent.",
      "",
      "The alternative aggregates in a derived table, classifying senders with an `IN` subquery, then compares with `total / 2` (decimal division, so 3 > 2.5 behaves). Both read the messages once.",
    ].join("\n"),
  },

  {
    slug: "microsoft-xbox-players-who-completed-a-title",
    title: "Microsoft: Xbox Players Who Unlocked Every Achievement in a Title",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Subqueries", "Dates"],
    description: [
      "The Xbox achievements team wants to know who has fully completed a game — unlocked **every** achievement it offers — and how long the run took.",
      "",
      "Return `gamertag`, `title_name` and `days_to_complete` for every player who has unlocked all of a title's achievements, where `days_to_complete` is the number of calendar days between the date of their first unlock in that title and the date of their last (`DATEDIFF`, so the time of day is ignored). A title with no achievements cannot be completed. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "XboxTitle",
        columns: [
          { name: "title_id", type: "int" },
          { name: "title_name", type: "varchar" },
        ],
        primaryKey: ["title_id"],
        note: "One row per game.",
      },
      {
        name: "Achievement",
        columns: [
          { name: "achievement_id", type: "int" },
          { name: "title_id", type: "int" },
          { name: "achievement_name", type: "varchar" },
        ],
        primaryKey: ["achievement_id"],
        note: "One row per achievement a title offers.",
      },
      {
        name: "AchievementUnlock",
        columns: [
          { name: "gamertag", type: "varchar" },
          { name: "achievement_id", type: "int" },
          { name: "unlocked_at", type: "datetime" },
        ],
        primaryKey: ["gamertag", "achievement_id"],
        note: "One row per player per achievement unlocked.",
      },
    ],
    examples: [
      {
        XboxTitle: [
          [1, "Halo Infinite"],
          [2, "Forza Motorsport"],
          [3, "Hi-Fi Rush"],
        ],
        Achievement: [
          [201, 1, "Spartan Initiate"],
          [202, 1, "Grapple Master"],
          [203, 1, "Legendary Finish"],
          [204, 2, "Green Flag"],
          [205, 2, "Podium Finish"],
        ],
        AchievementUnlock: [
          ["NovaRiya", 201, "2025-01-01 10:00:00"],
          ["NovaRiya", 202, "2025-01-03 21:00:00"],
          ["NovaRiya", 203, "2025-01-08 23:00:00"],
          ["PixelPriya", 201, "2025-01-02 18:00:00"],
          ["PixelPriya", 202, "2025-01-05 19:30:00"],
          ["NovaRiya", 204, "2025-02-10 08:00:00"],
          ["NovaRiya", 205, "2025-02-10 09:15:00"],
          ["ShadowKabir", 204, "2025-02-01 23:50:00"],
          ["ShadowKabir", 205, "2025-02-02 00:10:00"],
        ],
      },
    ],
    gen: (rng) => {
      const titles: Cell[][] = sample(rng, XBOX_TITLES, ri(rng, 1, 3)).map((t, i) => [i + 1, t]);
      const ach: Cell[][] = [];
      let aid = 201;
      for (const t of titles) for (let k = ri(rng, 0, 4); k > 0; k--) ach.push([aid, t[0]!, `Achievement ${aid++}`]);
      const unlocks: Cell[][] = [];
      for (const g of sample(rng, GAMERTAGS, ri(rng, 2, 6))) {
        for (const t of titles) {
          const mine = ach.filter((a) => a[1] === t[0]);
          const r = rng();
          if (r > 0.75 || !mine.length) continue;
          const start = dateBetween(rng, "2025-01-01", "2025-03-01");
          for (const a of mine) if (r < 0.4 || chance(rng, 0.5)) unlocks.push([g, a[0]!, atTime(rng, addDays(start, ri(rng, 0, 10)))]);
        }
      }
      return { XboxTitle: titles, Achievement: ach, AchievementUnlock: unlocks };
    },
    solution: [
      "WITH per_player AS (",
      "  SELECT u.gamertag, a.title_id, COUNT(*) AS unlocked,",
      "         MIN(u.unlocked_at) AS first_unlock, MAX(u.unlocked_at) AS last_unlock",
      "  FROM AchievementUnlock u",
      "  JOIN Achievement a ON a.achievement_id = u.achievement_id",
      "  GROUP BY u.gamertag, a.title_id",
      "), per_title AS (",
      "  SELECT title_id, COUNT(*) AS offered FROM Achievement GROUP BY title_id",
      ")",
      "SELECT p.gamertag, t.title_name, DATEDIFF(p.last_unlock, p.first_unlock) AS days_to_complete",
      "FROM per_player p",
      "JOIN per_title pt ON pt.title_id = p.title_id AND pt.offered = p.unlocked",
      "JOIN XboxTitle t ON t.title_id = p.title_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT g.gamertag, t.title_name,",
        "  DATEDIFF(",
        "    (SELECT MAX(u.unlocked_at) FROM AchievementUnlock u JOIN Achievement a ON a.achievement_id = u.achievement_id WHERE u.gamertag = g.gamertag AND a.title_id = g.title_id),",
        "    (SELECT MIN(u.unlocked_at) FROM AchievementUnlock u JOIN Achievement a ON a.achievement_id = u.achievement_id WHERE u.gamertag = g.gamertag AND a.title_id = g.title_id)",
        "  ) AS days_to_complete",
        "FROM (SELECT DISTINCT u.gamertag, a.title_id FROM AchievementUnlock u JOIN Achievement a ON a.achievement_id = u.achievement_id) g",
        "JOIN XboxTitle t ON t.title_id = g.title_id",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM Achievement a2",
        "  WHERE a2.title_id = g.title_id",
        "    AND NOT EXISTS (SELECT 1 FROM AchievementUnlock u2 WHERE u2.gamertag = g.gamertag AND u2.achievement_id = a2.achievement_id)",
        ")",
      ].join("\n"),
    ],
    hints: [
      "\"Every achievement\" is relational division: compare how many of a title's achievements a player has with how many it offers.",
      "Count per (player, title) from the unlocks, and per title from `Achievement`, then join where the counts match.",
      "The unlock table's primary key means a player cannot unlock the same achievement twice, so the counts are of distinct achievements.",
      "`DATEDIFF` compares dates only: 23:50 on one day to 00:10 on the next is 1 day.",
    ],
    editorial: [
      "\"Unlocked every achievement\" is **relational division**. The counting form is the easiest to get right: for each (gamertag, title) count the achievements the player unlocked, for each title count the achievements it offers, and keep the pairs where the two counts are equal. The primary key on (gamertag, achievement_id) guarantees the player's count is of distinct achievements, so equality really means \"all of them\". A title with no achievements has no row in `per_title` and no unlocks, so it can never qualify.",
      "",
      "The same GROUP BY gives the first and last unlock, and `DATEDIFF(last, first)` returns calendar days — MySQL ignores the time part, so a completion that ran from 23:50 to 00:10 counts as 1 day, and one finished on the same day as 0.",
      "",
      "The alternative states division literally with a double `NOT EXISTS`: keep a (player, title) pair if there is no achievement of the title that the player has not unlocked. It is elegant but correlated twice; the counting version is two aggregations and a join.",
    ].join("\n"),
  },

  {
    slug: "microsoft-unassigned-microsoft-365-seats-on-30-june",
    title: "Microsoft: Paid but Unassigned Microsoft 365 Seats on 30 June",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "A Microsoft customer-success manager is preparing for each customer's renewal and wants to show them the licences they paid for but are not using.",
      "",
      "A licence assignment is **active on 2025-06-30** when it was assigned on or before that day and either has not been removed or was removed **after** that day (removed on the 30th means it was gone that day). For every purchased (tenant, SKU) with **at least one idle seat** on that date, return `tenant_name`, `sku`, `seats`, `assigned_seats` (active assignments) and `idle_seats` (`seats` minus `assigned_seats`). A SKU with no assignments at all has every seat idle. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Tenant",
        columns: [
          { name: "tenant_id", type: "int" },
          { name: "tenant_name", type: "varchar" },
        ],
        primaryKey: ["tenant_id"],
        note: "One row per customer tenant.",
      },
      {
        name: "LicencePurchase",
        columns: [
          { name: "tenant_id", type: "int" },
          { name: "sku", type: "enum", values: ["E3", "E5", "F3", "Copilot"] },
          { name: "seats", type: "int" },
        ],
        primaryKey: ["tenant_id", "sku"],
        note: "How many seats of each SKU a tenant pays for.",
      },
      {
        name: "LicenceAssignment",
        columns: [
          { name: "assignment_id", type: "int" },
          { name: "tenant_id", type: "int" },
          { name: "sku", type: "enum", values: ["E3", "E5", "F3", "Copilot"] },
          { name: "user_upn", type: "varchar" },
          { name: "assigned_on", type: "date" },
          { name: "removed_on", type: "date" },
        ],
        primaryKey: ["assignment_id"],
        note: "One row per time a licence was given to a user; `removed_on` is NULL while it is still assigned and always after `assigned_on` otherwise.",
      },
    ],
    examples: [
      {
        Tenant: [
          [1, "Contoso Ltd"],
          [2, "Fabrikam Inc"],
          [3, "Northwind Traders"],
        ],
        LicencePurchase: [
          [1, "E3", 5],
          [1, "E5", 2],
          [2, "E3", 3],
          [2, "Copilot", 2],
          [3, "F3", 1],
        ],
        LicenceAssignment: [
          [1, 1, "E3", "asha@contoso.com", "2025-01-10", null],
          [2, 1, "E3", "ravi@contoso.com", "2025-06-30", null],
          [3, 1, "E3", "neha@contoso.com", "2025-02-01", "2025-06-30"],
          [4, 1, "E3", "dev@contoso.com", "2025-07-01", null],
          [5, 1, "E5", "meera@contoso.com", "2025-03-01", null],
          [6, 1, "E5", "kabir@contoso.com", "2025-03-02", "2025-08-01"],
          [7, 2, "E3", "alex@fabrikam.com", "2025-05-05", null],
          [8, 3, "F3", "john@northwind.com", "2025-01-01", null],
        ],
      },
    ],
    gen: (rng) => {
      const nt = ri(rng, 1, 3);
      const tenants: Cell[][] = sample(rng, CUSTOMERS, nt).map((n, i) => [i + 1, n]);
      const purchases: Cell[][] = [];
      const assigns: Cell[][] = [];
      let id = 1;
      for (const t of tenants) {
        for (const sku of sample(rng, ["E3", "E5", "F3", "Copilot"], ri(rng, 1, 3))) {
          const seats = ri(rng, 1, 6);
          purchases.push([t[0]!, sku, seats]);
          for (let k = ri(rng, 0, seats + 1); k > 0; k--) {
            const on = chance(rng, 0.15) ? pick(rng, ["2025-06-30", "2025-07-01"]) : dateBetween(rng, "2025-01-01", "2025-07-15");
            let off: string | null = chance(rng, 0.55) ? null : chance(rng, 0.3) ? pick(rng, ["2025-06-30", "2025-07-01"]) : addDays(on, ri(rng, 1, 150));
            if (off !== null && off <= on) off = addDays(on, 1);
            assigns.push([id, t[0]!, sku, `user${id}@tenant${t[0]}.com`, on, off]);
            id++;
          }
        }
      }
      return { Tenant: tenants, LicencePurchase: purchases, LicenceAssignment: assigns };
    },
    solution: [
      "SELECT t.tenant_name, p.sku, p.seats,",
      "       COUNT(a.assignment_id) AS assigned_seats,",
      "       p.seats - COUNT(a.assignment_id) AS idle_seats",
      "FROM LicencePurchase p",
      "JOIN Tenant t ON t.tenant_id = p.tenant_id",
      "LEFT JOIN LicenceAssignment a",
      "  ON a.tenant_id = p.tenant_id AND a.sku = p.sku",
      " AND a.assigned_on <= '2025-06-30'",
      " AND (a.removed_on IS NULL OR a.removed_on > '2025-06-30')",
      "GROUP BY t.tenant_id, t.tenant_name, p.sku, p.seats",
      "HAVING p.seats - COUNT(a.assignment_id) > 0",
    ].join("\n"),
    alternatives: [
      [
        "SELECT tenant_name, sku, seats, assigned_seats, seats - assigned_seats AS idle_seats",
        "FROM (",
        "  SELECT t.tenant_name, p.sku, p.seats,",
        "         (SELECT COUNT(*) FROM LicenceAssignment a",
        "          WHERE a.tenant_id = p.tenant_id AND a.sku = p.sku",
        "            AND '2025-06-30' BETWEEN a.assigned_on AND COALESCE(DATE_SUB(a.removed_on, INTERVAL 1 DAY), '2099-12-31')) AS assigned_seats",
        "  FROM LicencePurchase p JOIN Tenant t ON t.tenant_id = p.tenant_id",
        ") x",
        "WHERE seats > assigned_seats",
      ].join("\n"),
    ],
    hints: [
      "Write the \"active on a date\" test first: assigned by then, and not yet removed by then.",
      "Every purchased SKU must be considered even with no assignments — start from the purchases and LEFT JOIN.",
      "With a LEFT JOIN, the date conditions belong in `ON`; in `WHERE` they would drop the SKUs nobody holds.",
      "Filter on the idle count with `HAVING`, after counting.",
    ],
    editorial: [
      "The core is a point-in-time test on an interval: an assignment covers 30 June when `assigned_on <= '2025-06-30'` and `removed_on` is either NULL (still held) or **after** the 30th. The boundaries are where people slip: a licence assigned on the 30th counts, one removed on the 30th does not.",
      "",
      "Every purchase has to be judged, including SKUs nobody was given, so the query starts from `LicencePurchase` and LEFT JOINs the assignments with the whole activity test inside `ON`. Unmatched purchases keep one NULL row, and `COUNT(a.assignment_id)` counts it as 0, leaving every seat idle. Then `HAVING seats - assigned > 0` keeps only SKUs with money on the table; an over-assigned SKU (negative idle) is dropped too.",
      "",
      "The alternative counts with a correlated subquery per purchase, expressing activity as `'2025-06-30' BETWEEN assigned_on AND removed_on - 1 day` with a far-future stand-in for NULL. Both probe assignments by (tenant, sku).",
    ].join("\n"),
  },

  {
    slug: "microsoft-days-between-windows-insider-flights",
    title: "Microsoft: Days Between Windows Insider Flights per Channel",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "The Windows Insider programme team tracks release cadence: how many days pass between consecutive builds flighted to the same channel.",
      "",
      "Ignoring builds that were **pulled** (`is_pulled = 1`, withdrawn after release), return every remaining build with `channel`, `build_number`, `released_on` and `days_since_previous` — the days since the previous non-pulled build in the same channel, or NULL for a channel's first. Order by `channel`, then `released_on`.",
    ].join("\n"),
    tables: [
      {
        name: "InsiderFlight",
        columns: [
          { name: "build_number", type: "int" },
          { name: "channel", type: "varchar" },
          { name: "released_on", type: "date" },
          { name: "is_pulled", type: "bool" },
        ],
        primaryKey: ["build_number"],
        note: "One row per build flighted to Insiders. `channel` is one of `Canary`, `Dev`, `Beta`, `Release Preview`; a channel never gets two builds on the same day.",
      },
    ],
    examples: [
      {
        InsiderFlight: [
          [27764, "Canary", "2025-01-08", 0],
          [27768, "Canary", "2025-01-10", 1],
          [27774, "Canary", "2025-01-22", 0],
          [26120, "Dev", "2025-01-09", 0],
          [26200, "Dev", "2025-01-24", 0],
          [26212, "Dev", "2025-02-07", 0],
          [22635, "Beta", "2025-01-16", 0],
        ],
      },
    ],
    gen: (rng) => {
      const base: Record<string, [number, number]> = { Canary: [27700, 4], Dev: [26100, 10], Beta: [22630, 1], "Release Preview": [22600, 1] };
      const rows: Cell[][] = [];
      for (const ch of sample(rng, ["Canary", "Dev", "Beta", "Release Preview"], ri(rng, 1, 4))) {
        let d = dateBetween(rng, "2025-01-01", "2025-02-01");
        const [b, step] = base[ch]!;
        for (let i = 0, k = ri(rng, 1, 6); i < k; i++) {
          rows.push([b + i * step, ch, d, chance(rng, 0.15) ? 1 : 0]);
          d = addDays(d, ri(rng, 1, 21));
        }
      }
      return { InsiderFlight: rows };
    },
    solution: [
      "SELECT channel, build_number, released_on,",
      "       DATEDIFF(released_on, LAG(released_on) OVER (PARTITION BY channel ORDER BY released_on)) AS days_since_previous",
      "FROM InsiderFlight",
      "WHERE is_pulled = 0",
      "ORDER BY channel, released_on",
    ].join("\n"),
    alternatives: [
      [
        "SELECT f.channel, f.build_number, f.released_on,",
        "       DATEDIFF(f.released_on, (SELECT MAX(p.released_on) FROM InsiderFlight p",
        "                                WHERE p.channel = f.channel AND p.is_pulled = 0 AND p.released_on < f.released_on)) AS days_since_previous",
        "FROM InsiderFlight f",
        "WHERE f.is_pulled = 0",
        "ORDER BY f.channel, f.released_on",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`LAG(released_on) OVER (PARTITION BY channel ORDER BY released_on)` is the previous build's date in the same channel.",
      "Remove pulled builds before the window runs, so a pulled build is never anyone's \"previous\".",
      "`DATEDIFF(x, NULL)` is NULL, which is exactly what the first build of a channel should show.",
    ],
    editorial: [
      "Each row needs a value from the row before it in its channel, which is what `LAG` does: partition by `channel`, order by `released_on`, and `LAG(released_on)` is the previous release date. `DATEDIFF` of the two gives the gap in days, and for the first build in a channel `LAG` returns NULL, so the gap is NULL as asked.",
      "",
      "Where the pulled builds are removed matters. `WHERE` runs before window functions, so filtering there means the window only ever sees surviving builds — a pulled build in the middle is skipped and the next build measures its gap from the one before it (27774 measures 14 days from 27764, not 12 from the pulled 27768).",
      "",
      "The alternative finds the previous date with a correlated `MAX(released_on)` over earlier non-pulled builds of the channel — the pre-window-function way, which re-scans the channel per row. The final ORDER BY sorts channel names alphabetically, so `Beta` comes first.",
    ].join("\n"),
  },

  {
    slug: "microsoft-bing-query-abandonment-rate-by-market",
    title: "Microsoft: Bing Query Abandonment Rate by Market",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Subqueries"],
    description: [
      "A Bing relevance analyst uses the abandonment rate — the share of searches where the user clicked no result — as a first signal that a market's results are poor.",
      "",
      "Ignoring bot traffic (`is_bot = 1`), for each market with at least one human query return `market`, `queries` (human queries), `abandoned_queries` (human queries with **no click** at all) and `abandonment_pct` = 100 × abandoned ÷ queries, rounded to 2 decimals. A query clicked several times still counts once. Order by `abandonment_pct` descending, then `market` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "BingQuery",
        columns: [
          { name: "query_id", type: "int" },
          { name: "market", type: "varchar" },
          { name: "is_bot", type: "bool" },
          { name: "issued_at", type: "datetime" },
        ],
        primaryKey: ["query_id"],
        note: "One row per search; `market` is a locale code such as `en-IN`.",
      },
      {
        name: "ResultClick",
        columns: [
          { name: "click_id", type: "int" },
          { name: "query_id", type: "int" },
          { name: "position", type: "int" },
        ],
        primaryKey: ["click_id"],
        note: "One row per click on a result of a query; `position` is the result's rank on the page.",
      },
    ],
    examples: [
      {
        BingQuery: [
          [1, "en-IN", 0, "2025-08-01 09:00:00"],
          [2, "en-IN", 0, "2025-08-01 09:02:00"],
          [3, "en-IN", 0, "2025-08-01 09:05:00"],
          [4, "en-IN", 0, "2025-08-01 09:07:00"],
          [5, "en-US", 0, "2025-08-01 10:00:00"],
          [6, "en-US", 0, "2025-08-01 10:01:00"],
          [7, "en-US", 0, "2025-08-01 10:03:00"],
          [8, "en-US", 1, "2025-08-01 10:04:00"],
          [9, "fr-FR", 1, "2025-08-01 11:00:00"],
          [10, "de-DE", 0, "2025-08-01 12:00:00"],
          [11, "ja-JP", 0, "2025-08-01 13:00:00"],
        ],
        ResultClick: [
          [1, 1, 1],
          [2, 1, 3],
          [3, 3, 2],
          [4, 5, 1],
          [5, 6, 4],
          [6, 11, 1],
        ],
      },
    ],
    gen: (rng) => {
      const markets = sample(rng, ["en-US", "en-IN", "en-GB", "de-DE", "fr-FR", "ja-JP", "pt-BR"], ri(rng, 2, 5));
      const clickRate = new Map(markets.map((m) => [m, rng()]));
      const n = ri(rng, 3, 30);
      const queries: Cell[][] = seq(1, n).map((id) => [id, pick(rng, markets), chance(rng, 0.15) ? 1 : 0, atTime(rng, dateBetween(rng, "2025-08-01", "2025-08-07"))]);
      const clicks: Cell[][] = [];
      for (const q of queries) {
        if (rng() < clickRate.get(q[1] as string)!) for (let k = ri(rng, 1, 2); k > 0; k--) clicks.push([clicks.length + 1, q[0]!, ri(rng, 1, 10)]);
      }
      return { BingQuery: queries, ResultClick: clicks };
    },
    solution: [
      "WITH human AS (",
      "  SELECT q.market,",
      "         CASE WHEN EXISTS (SELECT 1 FROM ResultClick c WHERE c.query_id = q.query_id) THEN 0 ELSE 1 END AS abandoned",
      "  FROM BingQuery q",
      "  WHERE q.is_bot = 0",
      ")",
      "SELECT market, COUNT(*) AS queries, SUM(abandoned) AS abandoned_queries,",
      "       ROUND(100 * SUM(abandoned) / COUNT(*), 2) AS abandonment_pct",
      "FROM human",
      "GROUP BY market",
      "ORDER BY abandonment_pct DESC, market",
    ].join("\n"),
    alternatives: [
      [
        "SELECT q.market, COUNT(*) AS queries, COUNT(*) - COUNT(c.query_id) AS abandoned_queries,",
        "       ROUND(100 * (COUNT(*) - COUNT(c.query_id)) / COUNT(*), 2) AS abandonment_pct",
        "FROM BingQuery q",
        "LEFT JOIN (SELECT DISTINCT query_id FROM ResultClick) c ON c.query_id = q.query_id",
        "WHERE q.is_bot = 0",
        "GROUP BY q.market",
        "ORDER BY abandonment_pct DESC, q.market",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Decide per query whether it has any click before you aggregate per market.",
      "Joining raw clicks would count a query once per click — use `EXISTS`, or join to the distinct clicked query ids.",
      "Bots are filtered out of both the numerator and the denominator.",
    ],
    editorial: [
      "The unit is a **query**, and the only fact needed per query is whether any click exists. `EXISTS` answers that without multiplying rows: a query with two clicks is still one clicked query. Joining `ResultClick` directly and counting would inflate the totals for every multi-click query — the most common bug in this kind of metric.",
      "",
      "Bot traffic is removed in `WHERE` before anything is counted, so it affects neither the denominator nor the abandoned count, and a market with only bot traffic forms no group. Then per market: `COUNT(*)` human queries, `SUM(abandoned)`, and the percentage — computed with `100 * … / …`, which is decimal division in MySQL, then rounded. Ties on the rounded rate are broken by market.",
      "",
      "The alternative LEFT JOINs to `SELECT DISTINCT query_id FROM ResultClick`, which de-duplicates clicks first, and counts abandoned queries as `COUNT(*) - COUNT(c.query_id)`. Both are linear in queries plus clicks.",
    ].join("\n"),
  },

  {
    slug: "microsoft-top-human-contributor-per-github-repo",
    title: "Microsoft: Top Human Contributor per GitHub Repository in 2025",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation", "Strings"],
    description: [
      "Microsoft's open-source programme office wants to thank the leading human contributor of each of its GitHub repositories for 2025.",
      "",
      "Count each author's pull requests **merged in 2025** per repository, ignoring bot accounts (any login ending in `[bot]`, such as `dependabot[bot]`). For every repository, return the author or authors with the **most** merged PRs — **all of them when tied** — as `repo_name`, `author_login` and `merged_prs`. Repositories with no qualifying merged PR are not listed. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "PullRequest",
        columns: [
          { name: "pr_id", type: "int" },
          { name: "repo_name", type: "varchar" },
          { name: "author_login", type: "varchar" },
          { name: "state", type: "enum", values: ["open", "closed", "merged"] },
          { name: "merged_at", type: "datetime" },
        ],
        primaryKey: ["pr_id"],
        note: "One row per pull request. `merged_at` is set only when `state` is `merged`.",
      },
    ],
    examples: [
      {
        PullRequest: [
          [1, "vscode", "priya-dev", "merged", "2025-02-10 12:00:00"],
          [2, "vscode", "priya-dev", "merged", "2025-05-03 09:30:00"],
          [3, "vscode", "rahul-codes", "merged", "2025-03-14 16:00:00"],
          [4, "vscode", "rahul-codes", "merged", "2025-11-20 11:45:00"],
          [5, "vscode", "dependabot[bot]", "merged", "2025-01-05 02:00:00"],
          [6, "vscode", "dependabot[bot]", "merged", "2025-02-05 02:00:00"],
          [7, "vscode", "dependabot[bot]", "merged", "2025-03-05 02:00:00"],
          [8, "vscode", "zara-ml", "merged", "2024-12-31 23:59:59"],
          [9, "vscode", "zara-ml", "open", null],
          [10, "terminal", "kabir-ops", "merged", "2025-06-01 10:00:00"],
          [11, "terminal", "arjun-k", "closed", null],
          [12, "PowerToys", "meera-ts", "open", null],
        ],
      },
    ],
    gen: (rng) => {
      const repos = sample(rng, GH_REPOS, ri(rng, 1, 3));
      const authors = [...sample(rng, GH_LOGINS, ri(rng, 2, 4)), ...sample(rng, ["dependabot[bot]", "github-actions[bot]"], ri(rng, 0, 1))];
      const n = ri(rng, 3, 25);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const state = pick(rng, ["merged", "merged", "merged", "open", "closed"]);
        const when =
          state !== "merged"
            ? null
            : chance(rng, 0.15)
              ? pick(rng, ["2024-12-31 23:59:59", "2025-01-01 00:00:00", "2025-12-31 23:59:59", "2026-01-01 00:00:00"])
              : atTime(rng, dateBetween(rng, "2024-12-01", "2026-01-15"));
        return [id, pick(rng, repos), pick(rng, authors), state, when];
      });
      return { PullRequest: rows };
    },
    solution: [
      "WITH counts AS (",
      "  SELECT repo_name, author_login, COUNT(*) AS merged_prs",
      "  FROM PullRequest",
      "  WHERE state = 'merged'",
      "    AND merged_at >= '2025-01-01' AND merged_at < '2026-01-01'",
      "    AND author_login NOT LIKE '%[bot]'",
      "  GROUP BY repo_name, author_login",
      "), ranked AS (",
      "  SELECT repo_name, author_login, merged_prs,",
      "         RANK() OVER (PARTITION BY repo_name ORDER BY merged_prs DESC) AS pos",
      "  FROM counts",
      ")",
      "SELECT repo_name, author_login, merged_prs FROM ranked WHERE pos = 1",
    ].join("\n"),
    alternatives: [
      [
        "WITH counts AS (",
        "  SELECT repo_name, author_login, COUNT(*) AS merged_prs",
        "  FROM PullRequest",
        "  WHERE state = 'merged' AND YEAR(merged_at) = 2025 AND RIGHT(author_login, 5) <> '[bot]'",
        "  GROUP BY repo_name, author_login",
        ")",
        "SELECT c.repo_name, c.author_login, c.merged_prs",
        "FROM counts c",
        "JOIN (SELECT repo_name, MAX(merged_prs) AS best FROM counts GROUP BY repo_name) m",
        "  ON m.repo_name = c.repo_name AND m.best = c.merged_prs",
      ].join("\n"),
    ],
    hints: [
      "First count merged 2025 PRs per (repository, author), with bots filtered out.",
      "`NOT LIKE '%[bot]'` works because square brackets have no special meaning in a MySQL `LIKE` pattern.",
      "`RANK()` gives tied authors the same position, so keeping position 1 keeps every tied leader.",
    ],
    editorial: [
      "Two steps. First, count: filter to PRs that were merged inside 2025 (a half-open range, so 23:59:59 on New Year's Eve 2024 and midnight on 1 January 2026 are both out), drop logins ending in `[bot]`, and group by repository and author. Bots must be removed **before** ranking — otherwise `dependabot[bot]` would top a busy repository and hide the humans entirely.",
      "",
      "Second, pick the leader per repository. `RANK() OVER (PARTITION BY repo_name ORDER BY merged_prs DESC)` numbers authors within each repository with ties sharing a rank, so `WHERE pos = 1` returns every tied leader. `ROW_NUMBER()` would pick one of them arbitrarily, and the answer would depend on storage order.",
      "",
      "The alternative avoids window functions: compute the per-repository maximum in a derived table and join back on equality, which also keeps ties. It uses `RIGHT(login, 5) <> '[bot]'` for the bot test. Both aggregate once.",
    ].join("\n"),
  },

  {
    slug: "microsoft-customers-billed-for-azure-and-m365",
    title: "Microsoft: Customers Billed for Both Azure and Microsoft 365",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Subqueries"],
    description: [
      "A Microsoft commercial-sales analyst is sizing the cross-sell base: customers who pay for both the Azure cloud and Microsoft 365.",
      "",
      "Return every customer with **at least one Azure invoice and at least one Microsoft 365 invoice**, as `customer_name`, `azure_total` (sum of their Azure invoices) and `m365_total` (sum of their Microsoft 365 invoices). Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Customer",
        columns: [
          { name: "customer_id", type: "int" },
          { name: "customer_name", type: "varchar" },
        ],
        primaryKey: ["customer_id"],
        note: "One row per commercial customer.",
      },
      {
        name: "AzureInvoice",
        columns: [
          { name: "invoice_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "invoice_month", type: "char" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["invoice_id"],
        note: "One row per monthly Azure invoice (`invoice_month` as 'YYYY-MM'); amounts in US dollars.",
      },
      {
        name: "M365Invoice",
        columns: [
          { name: "invoice_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "invoice_month", type: "char" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["invoice_id"],
        note: "One row per monthly Microsoft 365 invoice.",
      },
    ],
    examples: [
      {
        Customer: [
          [1, "Contoso"],
          [2, "Fabrikam"],
          [3, "Northwind Traders"],
          [4, "Tailspin Toys"],
        ],
        AzureInvoice: [
          [1, 1, "2025-01", 1000],
          [2, 1, "2025-02", 2000],
          [3, 1, "2025-03", 1500],
          [4, 2, "2025-01", 800],
          [5, 4, "2025-02", 2500],
        ],
        M365Invoice: [
          [1, 1, "2025-01", 300],
          [2, 1, "2025-02", 300],
          [3, 3, "2025-01", 900],
          [4, 4, "2025-01", 100],
          [5, 4, "2025-02", 200],
          [6, 4, "2025-03", 300],
        ],
      },
    ],
    gen: (rng) => {
      const nc = ri(rng, 1, 6);
      const customers: Cell[][] = sample(rng, CUSTOMERS, nc).map((n, i) => [i + 1, n]);
      const az: Cell[][] = [];
      const m3: Cell[][] = [];
      const months = ["2025-01", "2025-02", "2025-03", "2025-04"];
      for (const c of customers) {
        if (chance(rng, 0.65)) for (let k = ri(rng, 1, 3); k > 0; k--) az.push([az.length + 1, c[0]!, pick(rng, months), roundTo(rng, 100, 5000, 100)]);
        if (chance(rng, 0.65)) for (let k = ri(rng, 1, 3); k > 0; k--) m3.push([m3.length + 1, c[0]!, pick(rng, months), roundTo(rng, 100, 2000, 100)]);
      }
      return { Customer: customers, AzureInvoice: az, M365Invoice: m3 };
    },
    solution: [
      "SELECT c.customer_name, a.azure_total, m.m365_total",
      "FROM Customer c",
      "JOIN (SELECT customer_id, SUM(amount) AS azure_total FROM AzureInvoice GROUP BY customer_id) a",
      "  ON a.customer_id = c.customer_id",
      "JOIN (SELECT customer_id, SUM(amount) AS m365_total FROM M365Invoice GROUP BY customer_id) m",
      "  ON m.customer_id = c.customer_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.customer_name,",
        "  (SELECT SUM(amount) FROM AzureInvoice a WHERE a.customer_id = c.customer_id) AS azure_total,",
        "  (SELECT SUM(amount) FROM M365Invoice m WHERE m.customer_id = c.customer_id) AS m365_total",
        "FROM Customer c",
        "WHERE EXISTS (SELECT 1 FROM AzureInvoice a WHERE a.customer_id = c.customer_id)",
        "  AND EXISTS (SELECT 1 FROM M365Invoice m WHERE m.customer_id = c.customer_id)",
      ].join("\n"),
      [
        "SELECT c.customer_name, SUM(CASE WHEN b.src = 'azure' THEN b.amount ELSE 0 END) AS azure_total,",
        "       SUM(CASE WHEN b.src = 'm365' THEN b.amount ELSE 0 END) AS m365_total",
        "FROM Customer c",
        "JOIN (SELECT customer_id, amount, 'azure' AS src FROM AzureInvoice",
        "      UNION ALL SELECT customer_id, amount, 'm365' AS src FROM M365Invoice) b ON b.customer_id = c.customer_id",
        "GROUP BY c.customer_id, c.customer_name",
        "HAVING COUNT(CASE WHEN b.src = 'azure' THEN 1 END) > 0 AND COUNT(CASE WHEN b.src = 'm365' THEN 1 END) > 0",
      ].join("\n"),
    ],
    hints: [
      "Joining a customer to both invoice tables at once pairs every Azure invoice with every Microsoft 365 invoice.",
      "Aggregate each invoice table to one row per customer first, then join the two totals.",
      "Inner joins to both per-customer totals keep exactly the customers who have both.",
    ],
    editorial: [
      "The trap here is **fan-out**. Joining `Customer` to `AzureInvoice` and `M365Invoice` in one go produces one row per *pair* of invoices: Contoso's three Azure invoices meet its two Microsoft 365 invoices six times, so a `SUM` after that join reports $9,000 of Azure instead of $4,500, and $900 of Microsoft 365 instead of $600. The numbers look plausible, which is what makes the bug dangerous.",
      "",
      "The fix is to aggregate each fact table to one row per customer **before** joining. Then each customer meets at most one Azure total and one Microsoft 365 total, and inner joins to both keep exactly the customers who have each kind of invoice — the \"both\" condition costs nothing extra.",
      "",
      "Two alternatives: scalar subqueries per customer guarded by two `EXISTS`, and a `UNION ALL` of both tables tagged by source, pivoted with conditional sums and filtered with `HAVING`. All three read each invoice table once.",
    ].join("\n"),
  },

  {
    slug: "microsoft-teams-daily-stickiness-dau-over-mau",
    title: "Microsoft: Teams Daily Stickiness (DAU/MAU) in March 2025",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Dates", "Joins"],
    description: [
      "The Microsoft Teams engagement team tracks **stickiness**: how many of the people who used Teams in the last month also used it today. A high DAU/MAU ratio means Teams is a daily habit, not an occasional tool.",
      "",
      "For every day of **March 2025** with any activity, return `activity_date`, `dau` (distinct users active that day), `mau` (distinct users active in the **30 days ending that day** — the day itself and the 29 before it, including days in February) and `stickiness_pct` = 100 × `dau` ÷ `mau`, rounded to 2 decimals. A user with several actions counts once in each figure. Order by `activity_date`.",
    ].join("\n"),
    tables: [
      {
        name: "TeamsActivity",
        columns: [
          { name: "activity_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "activity_date", type: "date" },
          { name: "activity_type", type: "enum", values: ["chat", "call", "meeting", "file"] },
        ],
        primaryKey: ["activity_id"],
        note: "One row per qualifying action in Teams; a user can have many rows a day.",
      },
    ],
    examples: [
      {
        TeamsActivity: [
          [1, 1, "2025-02-01", "chat"],
          [2, 2, "2025-02-20", "call"],
          [3, 3, "2025-03-02", "chat"],
          [4, 3, "2025-03-02", "meeting"],
          [5, 3, "2025-03-03", "file"],
          [6, 4, "2025-03-03", "chat"],
          [7, 2, "2025-03-31", "chat"],
          [8, 5, "2025-03-31", "meeting"],
          [9, 1, "2025-04-01", "chat"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 3, 30);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 1, 8),
        chance(rng, 0.15) ? pick(rng, ["2025-01-31", "2025-02-01", "2025-03-01", "2025-03-31", "2025-04-01"]) : dateBetween(rng, "2025-01-28", "2025-04-03"),
        pick(rng, ["chat", "call", "meeting", "file"]),
      ]);
      return { TeamsActivity: rows };
    },
    solution: [
      "WITH march_days AS (",
      "  SELECT DISTINCT activity_date AS on_day",
      "  FROM TeamsActivity",
      "  WHERE activity_date >= '2025-03-01' AND activity_date < '2025-04-01'",
      ")",
      "SELECT d.on_day AS activity_date,",
      "       COUNT(DISTINCT CASE WHEN a.activity_date = d.on_day THEN a.user_id END) AS dau,",
      "       COUNT(DISTINCT a.user_id) AS mau,",
      "       ROUND(100 * COUNT(DISTINCT CASE WHEN a.activity_date = d.on_day THEN a.user_id END) / COUNT(DISTINCT a.user_id), 2) AS stickiness_pct",
      "FROM march_days d",
      "JOIN TeamsActivity a ON a.activity_date BETWEEN DATE_SUB(d.on_day, INTERVAL 29 DAY) AND d.on_day",
      "GROUP BY d.on_day",
      "ORDER BY d.on_day",
    ].join("\n"),
    alternatives: [
      [
        "SELECT activity_date, dau, mau, ROUND(100 * dau / mau, 2) AS stickiness_pct",
        "FROM (",
        "  SELECT t.activity_date, t.dau,",
        "         (SELECT COUNT(DISTINCT a.user_id) FROM TeamsActivity a",
        "          WHERE DATEDIFF(t.activity_date, a.activity_date) BETWEEN 0 AND 29) AS mau",
        "  FROM (SELECT activity_date, COUNT(DISTINCT user_id) AS dau",
        "        FROM TeamsActivity",
        "        WHERE YEAR(activity_date) = 2025 AND MONTH(activity_date) = 3",
        "        GROUP BY activity_date) t",
        ") x",
        "ORDER BY activity_date",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "DAU is a plain `COUNT(DISTINCT user_id)` per day; MAU is the same count over a 30-day window ending on that day.",
      "`COUNT(DISTINCT …)` cannot be used as a window function, so build the window with a join: each March day meets every activity in its last 30 days.",
      "The 30 days ending on 2 March run from 1 February: the day minus 29 days, inclusive.",
      "Inside that join, a conditional `COUNT(DISTINCT CASE WHEN a.activity_date = day THEN user_id END)` gives DAU from the same rows.",
    ],
    editorial: [
      "Stickiness divides two distinct counts over different windows: the users of one day by the users of the 30 days that end on it. DAU is easy, but MAU is a **trailing distinct count**, and that is the catch: `COUNT(DISTINCT …) OVER (… ROWS 29 PRECEDING)` is not allowed, and even a `SUM` window would count a person once for every day they were active. Distinct users need the raw rows.",
      "",
      "So the window is built with a join. Take every March day that had activity, and join it to every activity dated from `DATE_SUB(day, INTERVAL 29 DAY)` to the day itself. Each day's group then holds exactly its trailing month of rows, including February rows for early March: user 1's activity on 1 February is in the 2 March window but not the 3 March one. `COUNT(DISTINCT a.user_id)` is MAU, and a conditional distinct count of the rows dated on the day is DAU. MAU is never zero, because the day's own users are in it.",
      "",
      "The alternative computes DAU per day first and MAU with a correlated subquery using `DATEDIFF(day, activity) BETWEEN 0 AND 29`. Both cost a pass over the activity per reported day; a production table would precompute daily distinct users per person first.",
    ].join("\n"),
  },

  {
    slug: "microsoft-privileged-azure-role-holders-access-review",
    title: "Microsoft: Privileged Azure Role Holders for the Access Review",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation", "Subqueries"],
    description: [
      "An Azure security engineer is preparing a quarterly access review of people who can change permissions or own resources.",
      "",
      "For every **User** principal holding `Owner` or `User Access Administrator` at **any** scope, return `principal_name`, `roles` — **all** the distinct role names that user holds (privileged or not), sorted alphabetically and joined by `', '` — and `scope_count`, the number of distinct scopes they hold any role at. Groups and service principals are reviewed separately and are not listed. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "RoleAssignment",
        columns: [
          { name: "assignment_id", type: "int" },
          { name: "principal_name", type: "varchar" },
          { name: "principal_type", type: "enum", values: ["User", "Group", "ServicePrincipal"] },
          { name: "role_name", type: "varchar" },
          { name: "scope", type: "varchar" },
        ],
        primaryKey: ["assignment_id"],
        note: "One row per Azure RBAC role assignment. `scope` is a subscription or resource-group path; a principal's name identifies it.",
      },
    ],
    examples: [
      {
        RoleAssignment: [
          [1, "priya@contoso.com", "User", "Owner", "/subscriptions/sub-prod-01"],
          [2, "priya@contoso.com", "User", "Reader", "/subscriptions/sub-dev-02"],
          [3, "priya@contoso.com", "User", "Owner", "/subscriptions/sub-dev-02"],
          [4, "rahul@contoso.com", "User", "Contributor", "/subscriptions/sub-prod-01"],
          [5, "grp-platform-admins", "Group", "Owner", "/subscriptions/sub-prod-01"],
          [6, "sp-deploy-pipeline", "ServicePrincipal", "User Access Administrator", "/subscriptions/sub-prod-01"],
          [7, "zara@contoso.com", "User", "User Access Administrator", "/subscriptions/sub-prod-01/resourceGroups/rg-data"],
          [8, "zara@contoso.com", "User", "Contributor", "/subscriptions/sub-prod-01/resourceGroups/rg-data"],
          [9, "zara@contoso.com", "User", "Key Vault Secrets User", "/subscriptions/sub-prod-01/resourceGroups/rg-data"],
        ],
      },
    ],
    gen: (rng) => {
      const users = names(rng, ri(rng, 2, 5)).map((n) => [upnOf(n), "User"] as const);
      const others = [["grp-platform-admins", "Group"], ["grp-finops", "Group"], ["sp-deploy-pipeline", "ServicePrincipal"], ["sp-backup-agent", "ServicePrincipal"]] as const;
      const principals = [...users, ...sample(rng, others, ri(rng, 0, 2))];
      const roles = ["Owner", "Owner", "User Access Administrator", "Contributor", "Contributor", "Reader", "Reader", "Key Vault Secrets User", "Storage Blob Data Reader"];
      const scopes = ["/subscriptions/sub-prod-01", "/subscriptions/sub-dev-02", "/subscriptions/sub-prod-01/resourceGroups/rg-data", "/subscriptions/sub-prod-01/resourceGroups/rg-web"];
      const n = ri(rng, 2, 20);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const [p, t] = pick(rng, principals);
        return [id, p, t, pick(rng, roles), pick(rng, scopes)];
      });
      return { RoleAssignment: rows };
    },
    solution: [
      "SELECT principal_name,",
      "       GROUP_CONCAT(DISTINCT role_name ORDER BY role_name SEPARATOR ', ') AS roles,",
      "       COUNT(DISTINCT scope) AS scope_count",
      "FROM RoleAssignment",
      "WHERE principal_type = 'User'",
      "  AND principal_name IN (",
      "    SELECT principal_name FROM RoleAssignment",
      "    WHERE principal_type = 'User' AND role_name IN ('Owner', 'User Access Administrator')",
      "  )",
      "GROUP BY principal_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT r.principal_name,",
        "       GROUP_CONCAT(r.role_name ORDER BY r.role_name SEPARATOR ', ') AS roles,",
        "       (SELECT COUNT(DISTINCT s.scope) FROM RoleAssignment s WHERE s.principal_name = r.principal_name) AS scope_count",
        "FROM (SELECT DISTINCT principal_name, role_name FROM RoleAssignment WHERE principal_type = 'User') r",
        "GROUP BY r.principal_name",
        "HAVING MAX(CASE WHEN r.role_name IN ('Owner', 'User Access Administrator') THEN 1 ELSE 0 END) = 1",
      ].join("\n"),
    ],
    hints: [
      "Choose the users first (those with a privileged role), but list all of their roles — so the privileged filter cannot simply sit in `WHERE`.",
      "`GROUP_CONCAT(DISTINCT x ORDER BY x SEPARATOR ', ')` builds a sorted, de-duplicated list.",
      "A user who is Owner at two scopes still has the role listed once.",
    ],
    editorial: [
      "Two different row sets are involved: the **who** (users holding a privileged role anywhere) and the **what** (every role those users hold). Filtering `WHERE role_name IN ('Owner', …)` and then aggregating would answer the wrong question — Zara's list would shrink to just `User Access Administrator`, hiding the other access the reviewer needs to see. So the privileged test selects people in a subquery, and the outer query aggregates all of their assignments.",
      "",
      "`GROUP_CONCAT(DISTINCT role_name ORDER BY role_name SEPARATOR ', ')` produces one readable line per user: Priya is Owner at two scopes but the role appears once. `COUNT(DISTINCT scope)` counts places, not assignments. Groups and service principals are excluded by type in both parts.",
      "",
      "The alternative de-duplicates (principal, role) pairs in a derived table and moves the privileged test into `HAVING` with a conditional `MAX`, counting scopes with a correlated subquery. Same answer, different shape.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "microsoft-teams-attendees-present-for-three-quarters",
    title: "Microsoft: Teams Attendees Present for at Least 75% of a Meeting",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Aggregation"],
    description: [
      "A Teams attendance report feeds a training team's completion records: an attendee completes a session when they were present for **at least three quarters** of the scheduled meeting.",
      "",
      "People join from several devices at once and drop and rejoin, so their join sessions overlap. Count an attendee's **present minutes** as the minutes of the scheduled window (`start_at` to `end_at`) covered by **at least one** of their sessions — time in the lobby before the start or after the end does not count, and overlapping sessions count once. Return `meeting_id`, `attendee` and `present_minutes` for every attendee whose present minutes × 4 ≥ the meeting's scheduled minutes × 3. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "TeamsMeeting",
        columns: [
          { name: "meeting_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "start_at", type: "datetime" },
          { name: "end_at", type: "datetime" },
        ],
        primaryKey: ["meeting_id"],
        note: "One row per scheduled meeting; times are whole minutes.",
      },
      {
        name: "AttendanceSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "meeting_id", type: "int" },
          { name: "attendee", type: "varchar" },
          { name: "device", type: "enum", values: ["desktop", "mobile", "web"] },
          { name: "joined_at", type: "datetime" },
          { name: "left_at", type: "datetime" },
        ],
        primaryKey: ["session_id"],
        note: "One row per join from one device; `left_at` is after `joined_at`. Times are whole minutes and may fall outside the scheduled window.",
      },
    ],
    examples: [
      {
        TeamsMeeting: [
          [1, "Sprint review", "2025-05-06 10:00:00", "2025-05-06 11:00:00"],
          [2, "Design sync", "2025-05-07 15:00:00", "2025-05-07 15:40:00"],
        ],
        AttendanceSession: [
          [1, 1, "Priya", "desktop", "2025-05-06 09:58:00", "2025-05-06 10:30:00"],
          [2, 1, "Priya", "mobile", "2025-05-06 10:20:00", "2025-05-06 10:50:00"],
          [3, 1, "Rahul", "desktop", "2025-05-06 10:05:00", "2025-05-06 10:25:00"],
          [4, 1, "Rahul", "web", "2025-05-06 10:30:00", "2025-05-06 10:55:00"],
          [5, 1, "Zara", "desktop", "2025-05-06 10:00:00", "2025-05-06 10:44:00"],
          [6, 1, "Arjun", "mobile", "2025-05-06 10:50:00", "2025-05-06 11:30:00"],
          [7, 2, "Priya", "web", "2025-05-07 15:00:00", "2025-05-07 15:20:00"],
          [8, 2, "Priya", "desktop", "2025-05-07 15:05:00", "2025-05-07 15:15:00"],
          [9, 2, "Priya", "desktop", "2025-05-07 15:25:00", "2025-05-07 15:40:00"],
          [10, 2, "Kabir", "desktop", "2025-05-07 14:50:00", "2025-05-07 14:59:00"],
          [11, 2, "Kabir", "desktop", "2025-05-07 15:10:00", "2025-05-07 15:39:00"],
        ],
      },
    ],
    gen: (rng) => {
      const nm = ri(rng, 1, 3);
      const meetings: Cell[][] = [];
      const sessions: Cell[][] = [];
      for (let m = 1; m <= nm; m++) {
        const day = dateBetween(rng, "2025-05-05", "2025-05-09");
        const start = ri(rng, 108, 204) * 5;
        const dur = pick(rng, [30, 40, 45, 60, 80, 90]);
        meetings.push([m, pick(rng, ["Sprint review", "Design sync", "Security training", "All hands", "Customer call"]), at(day, start), at(day, start + dur)]);
        for (const who of names(rng, ri(rng, 1, 5))) {
          const r = rng();
          if (r < 0.3) {
            sessions.push([sessions.length + 1, m, who, pick(rng, ["desktop", "mobile", "web"]), at(day, start - ri(rng, 0, 5)), at(day, start + dur + ri(rng, 0, 5))]);
          } else if (r < 0.45 && dur % 4 === 0) {
            sessions.push([sessions.length + 1, m, who, "desktop", at(day, start), at(day, start + (dur * 3) / 4)]);
          } else {
            for (let k = ri(rng, 1, 3); k > 0; k--) {
              const j = start + ri(rng, -10, dur - 1);
              sessions.push([sessions.length + 1, m, who, pick(rng, ["desktop", "mobile", "web"]), at(day, j), at(day, j + ri(rng, 5, dur))]);
            }
          }
        }
      }
      return { TeamsMeeting: meetings, AttendanceSession: sessions };
    },
    solution: [
      "WITH clipped AS (",
      "  SELECT s.meeting_id, s.attendee, s.session_id,",
      "         GREATEST(s.joined_at, m.start_at) AS seg_start,",
      "         LEAST(s.left_at, m.end_at) AS seg_end",
      "  FROM AttendanceSession s",
      "  JOIN TeamsMeeting m ON m.meeting_id = s.meeting_id",
      "  WHERE s.joined_at < m.end_at AND s.left_at > m.start_at",
      "), reach AS (",
      "  SELECT c.*, MAX(seg_end) OVER (PARTITION BY meeting_id, attendee ORDER BY seg_start, session_id",
      "                                 ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS covered_until",
      "  FROM clipped c",
      "), islands AS (",
      "  SELECT r.*, SUM(CASE WHEN covered_until IS NULL OR seg_start > covered_until THEN 1 ELSE 0 END)",
      "         OVER (PARTITION BY meeting_id, attendee ORDER BY seg_start, session_id",
      "               ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS island",
      "  FROM reach r",
      "), merged AS (",
      "  SELECT meeting_id, attendee, island, MIN(seg_start) AS a, MAX(seg_end) AS b",
      "  FROM islands GROUP BY meeting_id, attendee, island",
      "), present AS (",
      "  SELECT meeting_id, attendee, SUM(TIMESTAMPDIFF(MINUTE, a, b)) AS present_minutes",
      "  FROM merged GROUP BY meeting_id, attendee",
      ")",
      "SELECT p.meeting_id, p.attendee, p.present_minutes",
      "FROM present p",
      "JOIN TeamsMeeting m ON m.meeting_id = p.meeting_id",
      "WHERE p.present_minutes * 4 >= TIMESTAMPDIFF(MINUTE, m.start_at, m.end_at) * 3",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE minute_no AS (",
        "  SELECT 0 AS k UNION ALL SELECT k + 1 FROM minute_no WHERE k < 239",
        "), grid AS (",
        "  SELECT m.meeting_id, DATE_ADD(m.start_at, INTERVAL n.k MINUTE) AS minute_at",
        "  FROM TeamsMeeting m JOIN minute_no n ON n.k < TIMESTAMPDIFF(MINUTE, m.start_at, m.end_at)",
        "), people AS (",
        "  SELECT DISTINCT meeting_id, attendee FROM AttendanceSession",
        ")",
        "SELECT p.meeting_id, p.attendee, COUNT(*) AS present_minutes",
        "FROM people p",
        "JOIN grid g ON g.meeting_id = p.meeting_id",
        "WHERE EXISTS (SELECT 1 FROM AttendanceSession s",
        "              WHERE s.meeting_id = p.meeting_id AND s.attendee = p.attendee",
        "                AND s.joined_at <= g.minute_at AND s.left_at > g.minute_at)",
        "GROUP BY p.meeting_id, p.attendee",
        "HAVING COUNT(*) * 4 >= (SELECT TIMESTAMPDIFF(MINUTE, m2.start_at, m2.end_at) FROM TeamsMeeting m2 WHERE m2.meeting_id = p.meeting_id) * 3",
      ].join("\n"),
    ],
    hints: [
      "Clip every session to the meeting window first with `GREATEST`/`LEAST`, and drop sessions that do not touch it.",
      "Overlapping intervals must be merged before you add up their lengths — summing raw sessions double-counts the overlap.",
      "Sort an attendee's sessions by start; a session starts a new merged block when it begins after the furthest end seen so far (a running `MAX` over the previous rows).",
      "Number the blocks with a running `SUM` of those \"new block\" flags, then take `MIN(start)`/`MAX(end)` per block.",
    ],
    editorial: [
      "Three steps: clip, merge, measure. **Clip** each session to the scheduled window — `GREATEST(joined_at, start_at)` to `LEAST(left_at, end_at)` — and drop sessions that do not overlap it at all (Kabir's 14:50–14:59 lobby wait). Lobby and overtime minutes vanish here.",
      "",
      "**Merge** is the classic interval-union pattern. Order an attendee's clipped sessions by start; `MAX(seg_end)` over all *previous* rows is how far they were already covered. A session that starts after that point opens a new block; a running `SUM` of the \"new block\" flags numbers the blocks, and each block spans `MIN(start)` to `MAX(end)`. Priya's desktop 10:00–10:30 and phone 10:20–10:50 become one 50-minute block, not 60 minutes; a session wholly inside another adds nothing because the running max already covers it.",
      "",
      "**Measure**: sum block lengths and compare `present × 4 ≥ scheduled × 3`, integer arithmetic so exactly 75% (Rahul's 45 of 60) passes. The alternative counts covered minutes on a generated minute grid with a recursive CTE — simpler to trust, but its cost grows with meeting length × attendees, while the window version is a sort per attendee.",
    ].join("\n"),
  },

  {
    slug: "microsoft-onedrive-file-paths-too-long-to-sync",
    title: "Microsoft: OneDrive Files Whose Full Path Is Too Long to Sync",
    difficulty: "HARD",
    topics: ["Subqueries", "Strings", "Joins"],
    description: [
      "OneDrive's sync client cannot sync a file whose full path is too long. A OneDrive support engineer is building a report of the files that will fail, using a pilot limit of **60 characters**.",
      "",
      "Folders form a tree: a top-level folder has `parent_id` NULL. A file's **full path** is a `/`, then the names of every folder from the top level down to the file's folder, each followed by `/`, then the file name — for example `/Documents/Projects/Plan.pptx`. Return `file_id`, `full_path`, `depth` (the number of folders in the path) and `path_length` (characters in the full path) for every file whose path is **longer than 60** characters. A path of exactly 60 syncs. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "OneDriveFolder",
        columns: [
          { name: "folder_id", type: "int" },
          { name: "parent_id", type: "int" },
          { name: "folder_name", type: "varchar" },
        ],
        primaryKey: ["folder_id"],
        note: "One row per folder; `parent_id` is the folder it sits in, or NULL at the top level. The tree never loops, and it can be any number of levels deep.",
      },
      {
        name: "OneDriveFile",
        columns: [
          { name: "file_id", type: "int" },
          { name: "folder_id", type: "int" },
          { name: "file_name", type: "varchar" },
        ],
        primaryKey: ["file_id"],
        note: "One row per file; every file sits in a folder.",
      },
    ],
    examples: [
      {
        OneDriveFolder: [
          [1, null, "Documents"],
          [2, 1, "Projects"],
          [3, 2, "Falcon Launch"],
          [4, 3, "Customer Interviews"],
          [5, null, "Pictures"],
          [6, 5, "Holi 2025"],
          [7, 1, "Archive"],
        ],
        OneDriveFile: [
          [10, 4, "Retail Interview Notes.docx"],
          [11, 3, "Plan.pptx"],
          [12, 6, "Family Celebration in Jaipur.jpg"],
          [13, 3, "Launch Budget FY25 v2.xlsx"],
          [14, 3, "Launch Budget v3 Final.xlsx"],
          [15, 2, "Quarterly Partner Review With Fabrikam.pptx"],
        ],
      },
    ],
    gen: (rng) => {
      const folderNames = ["Documents", "Projects", "Falcon Launch", "Customer Interviews", "Pictures", "Holi 2025", "Archive", "Finance", "Team Offsite Goa", "Design Reviews", "Q3 Planning", "Shared With Me"];
      const fileNames = ["Plan.pptx", "Notes.docx", "Budget.xlsx", "Retail Interview Notes.docx", "Launch Budget v3 Final.xlsx", "Quarterly Partner Review With Fabrikam.pptx", "Architecture Diagram.vsdx", "Family Photo.jpg", "Contract Signed Copy Scanned.pdf", "Standup.mp4", "Customer Feedback Synthesis Final Draft.docx"];
      const nf = ri(rng, 2, 8);
      const folders: Cell[][] = seq(1, nf).map((id) => [id, id === 1 || chance(rng, 0.1) ? null : ri(rng, Math.max(1, id - 2), id - 1), pick(rng, folderNames)]);
      const n = ri(rng, 3, 12);
      const files: Cell[][] = seq(10, n).map((id) => [id, ri(rng, Math.max(1, nf - 3), nf), pick(rng, fileNames)]);
      return { OneDriveFolder: folders, OneDriveFile: files };
    },
    solution: [
      "WITH RECURSIVE folder_path AS (",
      "  SELECT folder_id, CAST(CONCAT('/', folder_name, '/') AS CHAR(1000)) AS path, 1 AS depth",
      "  FROM OneDriveFolder",
      "  WHERE parent_id IS NULL",
      "  UNION ALL",
      "  SELECT f.folder_id, CONCAT(p.path, f.folder_name, '/'), p.depth + 1",
      "  FROM folder_path p",
      "  JOIN OneDriveFolder f ON f.parent_id = p.folder_id",
      ")",
      "SELECT d.file_id, CONCAT(p.path, d.file_name) AS full_path, p.depth,",
      "       CHAR_LENGTH(CONCAT(p.path, d.file_name)) AS path_length",
      "FROM OneDriveFile d",
      "JOIN folder_path p ON p.folder_id = d.folder_id",
      "WHERE CHAR_LENGTH(CONCAT(p.path, d.file_name)) > 60",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE climb AS (",
        "  SELECT file_id, folder_id AS at_folder, CAST(CONCAT('/', file_name) AS CHAR(1000)) AS tail, 0 AS depth",
        "  FROM OneDriveFile",
        "  UNION ALL",
        "  SELECT c.file_id, f.parent_id, CONCAT('/', f.folder_name, c.tail), c.depth + 1",
        "  FROM climb c",
        "  JOIN OneDriveFolder f ON f.folder_id = c.at_folder",
        ")",
        "SELECT file_id, tail AS full_path, depth, CHAR_LENGTH(tail) AS path_length",
        "FROM climb",
        "WHERE at_folder IS NULL AND CHAR_LENGTH(tail) > 60",
      ].join("\n"),
    ],
    hints: [
      "The folder tree can be any depth, so the path has to be built with `WITH RECURSIVE`, one level per step.",
      "Start from the top-level folders (`parent_id IS NULL`) and append each child's name to its parent's path.",
      "In MySQL a recursive CTE's column takes its type from the anchor row, so a short anchor string truncates the longer paths — `CAST(… AS CHAR(1000))` in the anchor.",
      "Join each file to its folder's path, then filter on `CHAR_LENGTH` of the full path.",
    ],
    editorial: [
      "A path is a **breadcrumb**: the names along the route from the root to the node, in order. The depth is not fixed, so a fixed chain of self-joins will always miss the deepest folders; a recursive CTE builds every folder's path one level at a time. The anchor takes the top-level folders, with path `/Documents/`; each step joins a folder to its parent's row and appends `name/`, so `Falcon Launch` becomes `/Documents/Projects/Falcon Launch/` at depth 3. A file's full path is its folder's path followed by the file name.",
      "",
      "One MySQL detail decides whether this works at all: a recursive CTE's column types come from the **anchor** member. If the anchor were just `CONCAT('/', folder_name, '/')`, the column would be as wide as the longest top-level name, and the deeper paths would be cut off, or the query would fail with \"Data too long\". Casting the anchor to `CHAR(1000)` gives the recursive rows room. The filter is strict, so `Launch Budget FY25 v2.xlsx`, at exactly 60 characters, is left out and the 61-character `v3 Final` is in.",
      "",
      "The alternative walks **upwards** from each file, putting the next folder name in front of the path until the parent is NULL. Top-down builds each folder's path once and shares it among that folder's files. Bottom-up repeats the work for every file, but it would stop early if you only needed some of the files.",
    ].join("\n"),
  },

  {
    slug: "microsoft-management-groups-over-azure-budget",
    title: "Microsoft: Management Groups Whose Rolled-Up Azure Spend Tops Budget",
    difficulty: "HARD",
    topics: ["Subqueries", "Joins", "Aggregation"],
    description: [
      "Azure management groups form a tree: each group can hold subscriptions and child groups. A cloud governance lead sets a monthly budget on some groups and wants to know which went over in **May 2025** (`cost_month = '2025-05'`).",
      "",
      "A group's **rolled-up cost** is the May cost of every subscription directly in it **or in any group below it**, at any depth. For each group that **has a budget** and whose rolled-up cost is **strictly greater** than it, return `group_name`, `rolled_up_cost` and `monthly_budget`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "ManagementGroup",
        columns: [
          { name: "group_id", type: "int" },
          { name: "group_name", type: "varchar" },
          { name: "parent_id", type: "int" },
          { name: "monthly_budget", type: "int" },
        ],
        primaryKey: ["group_id"],
        note: "One row per management group; `parent_id` is NULL for the root. `monthly_budget` is NULL when none is set. The hierarchy never loops.",
      },
      {
        name: "Subscription",
        columns: [
          { name: "subscription_id", type: "int" },
          { name: "group_id", type: "int" },
          { name: "display_name", type: "varchar" },
        ],
        primaryKey: ["subscription_id"],
        note: "Every subscription sits directly in exactly one management group.",
      },
      {
        name: "MonthlyCost",
        columns: [
          { name: "subscription_id", type: "int" },
          { name: "cost_month", type: "char" },
          { name: "cost", type: "int" },
        ],
        primaryKey: ["subscription_id", "cost_month"],
        note: "A subscription's billed cost for a month ('YYYY-MM'), in US dollars.",
      },
    ],
    examples: [
      {
        ManagementGroup: [
          [1, "Contoso Root", null, 20000],
          [2, "Platform", 1, 8000],
          [3, "Landing Zones", 1, 9000],
          [4, "Corp", 3, 4000],
          [5, "Online", 3, null],
          [6, "Sandbox", 1, 500],
        ],
        Subscription: [
          [101, 2, "connectivity"],
          [102, 2, "identity"],
          [103, 4, "corp-erp"],
          [104, 4, "corp-hr"],
          [105, 5, "online-store"],
          [106, 6, "sandbox-ml"],
        ],
        MonthlyCost: [
          [101, "2025-05", 3000],
          [102, "2025-05", 2500],
          [103, "2025-04", 9900],
          [103, "2025-05", 2600],
          [104, "2025-05", 1900],
          [105, "2025-05", 5000],
          [106, "2025-04", 900],
          [106, "2025-05", 500],
        ],
      },
    ],
    gen: (rng) => {
      const ng = ri(rng, 1, 7);
      const gnames = sample(rng, ["Contoso Root", "Platform", "Landing Zones", "Corp", "Online", "Sandbox", "Decommissioned", "Identity", "Data Platform"], ng);
      const groups: Cell[][] = gnames.map((name, i) => [i + 1, name, i === 0 ? null : ri(rng, 1, i), chance(rng, 0.25) ? null : roundTo(rng, 1000, 12000, 500)]);
      const ns = ri(rng, 0, 10);
      const subs: Cell[][] = seq(101, ns).map((id) => [id, ri(rng, 1, ng), `sub-${id}`]);
      const costs: Cell[][] = [];
      for (const s of subs) {
        if (chance(rng, 0.85)) costs.push([s[0]!, "2025-05", roundTo(rng, 100, 6000, 100)]);
        if (chance(rng, 0.5)) costs.push([s[0]!, "2025-04", roundTo(rng, 100, 6000, 100)]);
      }
      return { ManagementGroup: groups, Subscription: subs, MonthlyCost: costs };
    },
    solution: [
      "WITH RECURSIVE tree AS (",
      "  SELECT group_id AS ancestor_id, group_id AS member_id FROM ManagementGroup",
      "  UNION ALL",
      "  SELECT t.ancestor_id, g.group_id",
      "  FROM tree t JOIN ManagementGroup g ON g.parent_id = t.member_id",
      "), group_spend AS (",
      "  SELECT s.group_id, SUM(c.cost) AS cost",
      "  FROM Subscription s",
      "  JOIN MonthlyCost c ON c.subscription_id = s.subscription_id",
      "  WHERE c.cost_month = '2025-05'",
      "  GROUP BY s.group_id",
      ")",
      "SELECT g.group_name, SUM(gs.cost) AS rolled_up_cost, g.monthly_budget",
      "FROM ManagementGroup g",
      "JOIN tree t ON t.ancestor_id = g.group_id",
      "JOIN group_spend gs ON gs.group_id = t.member_id",
      "WHERE g.monthly_budget IS NOT NULL",
      "GROUP BY g.group_id, g.group_name, g.monthly_budget",
      "HAVING SUM(gs.cost) > g.monthly_budget",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE lineage AS (",
        "  SELECT s.subscription_id, s.group_id AS group_id FROM Subscription s",
        "  UNION ALL",
        "  SELECT l.subscription_id, g.parent_id",
        "  FROM lineage l JOIN ManagementGroup g ON g.group_id = l.group_id",
        "  WHERE g.parent_id IS NOT NULL",
        ")",
        "SELECT g.group_name, SUM(c.cost) AS rolled_up_cost, g.monthly_budget",
        "FROM lineage l",
        "JOIN MonthlyCost c ON c.subscription_id = l.subscription_id AND c.cost_month = '2025-05'",
        "JOIN ManagementGroup g ON g.group_id = l.group_id",
        "WHERE g.monthly_budget IS NOT NULL",
        "GROUP BY g.group_id, g.group_name, g.monthly_budget",
        "HAVING SUM(c.cost) > g.monthly_budget",
      ].join("\n"),
    ],
    hints: [
      "The depth of the tree is not fixed, so a fixed number of self joins cannot reach every descendant — use `WITH RECURSIVE`.",
      "Build every (ancestor, descendant) pair, including each group paired with itself.",
      "Sum May cost per group first, then add up the groups under each ancestor.",
      "Alternatively walk upwards: give each subscription every group above it, then group by that.",
    ],
    editorial: [
      "Rolled-up cost needs, for each group, the set of groups beneath it at **any** depth, and only recursion can produce that without knowing the depth in advance. The recursive CTE builds the **closure** of the tree: the anchor pairs every group with itself (so a group's own subscriptions count), and each step extends a pair (ancestor, member) to the member's children. Landing Zones ends up paired with itself, Corp and Online.",
      "",
      "Separately, May cost is summed per group from its own subscriptions — the April rows are filtered out here. Joining the closure to that, and grouping by ancestor, gives the rolled-up cost: Corp 4,500, Landing Zones 9,500 (Corp plus Online's 5,000, even though Online itself has no budget). Groups without a budget are skipped, and `HAVING SUM > budget` is strict, so Sandbox at exactly 500 is fine.",
      "",
      "The alternative walks **upwards**: every subscription is expanded into all of its ancestor groups, then costs are grouped by group. It recurses once per subscription rather than once per group, which suits wide trees with few subscriptions.",
    ].join("\n"),
  },

  {
    slug: "microsoft-azure-prepayment-overage-month-by-month",
    title: "Microsoft: Azure Prepayment Balance and Overage Month by Month",
    difficulty: "HARD",
    topics: ["Subqueries", "Conditional Logic"],
    description: [
      "An enterprise customer prepays a fixed Azure credit every month. A Microsoft billing analyst replays the agreement to explain each invoice.",
      "",
      "Each month the **available credit** is that month's `monthly_prepayment` plus whatever was carried forward from the month before (nothing before month 1). Usage draws the credit down; usage beyond the available credit is billed as **overage**. Unused credit carries into the next month, **capped at one month's prepayment** — anything above the cap expires. Return `agreement_id`, `month_no`, `available_credit`, `overage` and `carried_forward` for every month of usage, ordered by `agreement_id`, then `month_no`.",
    ].join("\n"),
    tables: [
      {
        name: "Agreement",
        columns: [
          { name: "agreement_id", type: "int" },
          { name: "customer_name", type: "varchar" },
          { name: "monthly_prepayment", type: "int" },
        ],
        primaryKey: ["agreement_id"],
        note: "One row per agreement; amounts in US dollars.",
      },
      {
        name: "AzureMonthUsage",
        columns: [
          { name: "agreement_id", type: "int" },
          { name: "month_no", type: "int" },
          { name: "usage_amount", type: "int" },
        ],
        primaryKey: ["agreement_id", "month_no"],
        note: "Azure usage per agreement and month of the term. Months are numbered from 1 with no gaps.",
      },
    ],
    examples: [
      {
        Agreement: [
          [1, "Contoso", 10000],
          [2, "Fabrikam", 5000],
          [3, "Litware", 20000],
        ],
        AzureMonthUsage: [
          [1, 1, 6000],
          [1, 2, 3000],
          [1, 3, 25000],
          [1, 4, 10000],
          [2, 1, 7000],
          [2, 2, 1000],
          [2, 3, 0],
        ],
      },
    ],
    gen: (rng) => {
      const na = ri(rng, 1, 4);
      const ags: Cell[][] = sample(rng, CUSTOMERS, na).map((n, i) => [i + 1, n, pick(rng, [5000, 10000, 20000])]);
      const usage: Cell[][] = [];
      for (const a of ags) {
        if (chance(rng, 0.1)) continue;
        const pre = a[2] as number;
        for (let m = 1, k = ri(rng, 1, 6); m <= k; m++) usage.push([a[0]!, m, chance(rng, 0.12) ? 0 : roundTo(rng, 0, pre * 2, 500)]);
      }
      return { Agreement: ags, AzureMonthUsage: usage };
    },
    solution: [
      "WITH RECURSIVE ledger AS (",
      "  SELECT u.agreement_id, u.month_no, a.monthly_prepayment AS available_credit,",
      "         u.usage_amount, a.monthly_prepayment AS cap",
      "  FROM AzureMonthUsage u",
      "  JOIN Agreement a ON a.agreement_id = u.agreement_id",
      "  WHERE u.month_no = 1",
      "  UNION ALL",
      "  SELECT u.agreement_id, u.month_no,",
      "         l.cap + LEAST(GREATEST(l.available_credit - l.usage_amount, 0), l.cap),",
      "         u.usage_amount, l.cap",
      "  FROM ledger l",
      "  JOIN AzureMonthUsage u ON u.agreement_id = l.agreement_id AND u.month_no = l.month_no + 1",
      ")",
      "SELECT agreement_id, month_no, available_credit,",
      "       GREATEST(usage_amount - available_credit, 0) AS overage,",
      "       LEAST(GREATEST(available_credit - usage_amount, 0), cap) AS carried_forward",
      "FROM ledger",
      "ORDER BY agreement_id, month_no",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE carry AS (",
        "  SELECT agreement_id, month_no, 0 AS carry_in FROM AzureMonthUsage WHERE month_no = 1",
        "  UNION ALL",
        "  SELECT c.agreement_id, c.month_no + 1,",
        "         CASE WHEN a.monthly_prepayment + c.carry_in - u.usage_amount <= 0 THEN 0",
        "              WHEN a.monthly_prepayment + c.carry_in - u.usage_amount > a.monthly_prepayment THEN a.monthly_prepayment",
        "              ELSE a.monthly_prepayment + c.carry_in - u.usage_amount END",
        "  FROM carry c",
        "  JOIN Agreement a ON a.agreement_id = c.agreement_id",
        "  JOIN AzureMonthUsage u ON u.agreement_id = c.agreement_id AND u.month_no = c.month_no",
        "  JOIN AzureMonthUsage nx ON nx.agreement_id = c.agreement_id AND nx.month_no = c.month_no + 1",
        ")",
        "SELECT c.agreement_id, c.month_no, a.monthly_prepayment + c.carry_in AS available_credit,",
        "       CASE WHEN u.usage_amount > a.monthly_prepayment + c.carry_in THEN u.usage_amount - a.monthly_prepayment - c.carry_in ELSE 0 END AS overage,",
        "       CASE WHEN a.monthly_prepayment + c.carry_in - u.usage_amount <= 0 THEN 0",
        "            WHEN a.monthly_prepayment + c.carry_in - u.usage_amount > a.monthly_prepayment THEN a.monthly_prepayment",
        "            ELSE a.monthly_prepayment + c.carry_in - u.usage_amount END AS carried_forward",
        "FROM carry c",
        "JOIN Agreement a ON a.agreement_id = c.agreement_id",
        "JOIN AzureMonthUsage u ON u.agreement_id = c.agreement_id AND u.month_no = c.month_no",
        "ORDER BY c.agreement_id, c.month_no",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Each month's starting credit depends on the previous month's *result*, not just its input — a running `SUM` cannot express the cap.",
      "A recursive CTE can carry state from one month to the next: anchor on month 1, then join month n + 1 to the row for month n.",
      "Leftover = available − usage, floored at 0 (`GREATEST`); carry = leftover capped at the prepayment (`LEAST`).",
      "Overage is usage − available, floored at 0.",
    ],
    editorial: [
      "Without the cap this would be a running total. The cap makes it **path-dependent**: what carries into month 3 depends on how much was clipped in month 2, which depends on month 1. Running sums and window functions cannot express \"clip, then continue\", so the ledger is replayed one month at a time with a recursive CTE.",
      "",
      "The anchor is month 1, where the available credit is just the prepayment. Each recursive step joins the next month's usage to the previous ledger row and computes the new available credit as prepayment + `LEAST(GREATEST(previous available − previous usage, 0), cap)`. For Contoso: month 1 leaves 4,000 (all carried); month 2 has 14,000, leaves 11,000, of which only 10,000 carries; month 3 has 20,000 against 25,000 of usage — 5,000 overage and nothing carried. The final SELECT derives overage and carry-forward from each row. An agreement with no usage rows (Litware) has no anchor and produces nothing.",
      "",
      "The alternative recurses on the carry alone, using `CASE` instead of `GREATEST`/`LEAST`, and computes the rest in the outer query. Both visit each month once.",
    ].join("\n"),
  },

  {
    slug: "microsoft-xbox-rare-achievement-hunters",
    title: "Microsoft: Xbox Hunters With the Most Rare Achievements",
    difficulty: "HARD",
    topics: ["Window Functions", "Subqueries", "Aggregation"],
    description: [
      "The Xbox community team wants to feature its best achievement hunters — the players with the most **rare** achievements.",
      "",
      "An achievement is **rare** when it has been unlocked by **fewer than 25%** of the title's players (`TitlePlayer` rows for that title). For each gamertag with at least one rare unlock, count `rare_unlocks`, and rank the gamertags by that count with **dense ranking** (ties share a rank, no gaps). Return `gamertag`, `rare_unlocks` and `hunter_rank` for the gamertags in the **top 3 ranks**, ordered by `hunter_rank`, then `gamertag`.",
    ].join("\n"),
    tables: [
      {
        name: "TitlePlayer",
        columns: [
          { name: "gamertag", type: "varchar" },
          { name: "title_id", type: "int" },
        ],
        primaryKey: ["gamertag", "title_id"],
        note: "One row per player who has played a title.",
      },
      {
        name: "Achievement",
        columns: [
          { name: "achievement_id", type: "int" },
          { name: "title_id", type: "int" },
          { name: "achievement_name", type: "varchar" },
        ],
        primaryKey: ["achievement_id"],
        note: "One row per achievement a title offers.",
      },
      {
        name: "AchievementUnlock",
        columns: [
          { name: "gamertag", type: "varchar" },
          { name: "achievement_id", type: "int" },
          { name: "unlocked_at", type: "datetime" },
        ],
        primaryKey: ["gamertag", "achievement_id"],
        note: "One row per unlock; only a player of the title can unlock its achievements.",
      },
    ],
    examples: [
      {
        TitlePlayer: [
          ["NovaRiya", 1], ["PixelPriya", 1], ["ShadowKabir", 1], ["BlazeArjun", 1],
          ["EchoZara", 1], ["ByteMeera", 1], ["OrbitDev", 1], ["LunaIra", 1],
          ["NovaRiya", 2], ["PixelPriya", 2], ["ShadowKabir", 2], ["BlazeArjun", 2], ["EchoZara", 2],
        ],
        Achievement: [
          [401, 1, "Legendary Campaign"],
          [402, 1, "Flawless Victory"],
          [403, 1, "Grapple Ace"],
          [404, 1, "Explorer"],
          [405, 2, "Into the Unknown"],
          [406, 2, "Speedrunner"],
          [407, 2, "Completionist"],
          [408, 2, "First Steps"],
        ],
        AchievementUnlock: [
          ["NovaRiya", 401, "2025-03-01 20:00:00"],
          ["NovaRiya", 402, "2025-03-02 21:00:00"],
          ["PixelPriya", 402, "2025-03-03 19:00:00"],
          ["PixelPriya", 403, "2025-03-04 22:00:00"],
          ["NovaRiya", 404, "2025-03-01 18:00:00"], ["PixelPriya", 404, "2025-03-01 18:30:00"], ["ShadowKabir", 404, "2025-03-01 19:00:00"],
          ["BlazeArjun", 404, "2025-03-02 18:00:00"], ["EchoZara", 404, "2025-03-02 18:30:00"], ["ByteMeera", 404, "2025-03-02 19:00:00"],
          ["NovaRiya", 405, "2025-04-01 20:00:00"],
          ["PixelPriya", 406, "2025-04-02 21:00:00"],
          ["ShadowKabir", 408, "2025-04-01 18:00:00"], ["NovaRiya", 408, "2025-04-01 18:05:00"], ["EchoZara", 408, "2025-04-01 18:10:00"],
          ["BlazeArjun", 408, "2025-04-01 18:15:00"], ["PixelPriya", 408, "2025-04-01 18:20:00"],
        ],
      },
    ],
    gen: (rng) => {
      const nt = ri(rng, 1, 3);
      const players: Cell[][] = [];
      const ach: Cell[][] = [];
      const unlocks: Cell[][] = [];
      for (let t = 1; t <= nt; t++) {
        const tp = sample(rng, GAMERTAGS, ri(rng, 5, 10));
        for (const g of tp) players.push([g, t]);
        for (let k = ri(rng, 2, 5); k > 0; k--) {
          const id = 400 + ach.length + 1;
          ach.push([id, t, `Achievement ${id}`]);
          const p = pick(rng, [0.1, 0.15, 0.2, 0.2, 0.6, 0.9]);
          for (const g of tp) if (chance(rng, p)) unlocks.push([g, id, atTime(rng, dateBetween(rng, "2025-03-01", "2025-04-30"))]);
        }
      }
      return { TitlePlayer: players, Achievement: ach, AchievementUnlock: unlocks };
    },
    solution: [
      "WITH title_players AS (",
      "  SELECT title_id, COUNT(*) AS players FROM TitlePlayer GROUP BY title_id",
      "), unlock_counts AS (",
      "  SELECT a.achievement_id, a.title_id, COUNT(u.gamertag) AS unlocks",
      "  FROM Achievement a",
      "  LEFT JOIN AchievementUnlock u ON u.achievement_id = a.achievement_id",
      "  GROUP BY a.achievement_id, a.title_id",
      "), rare AS (",
      "  SELECT uc.achievement_id",
      "  FROM unlock_counts uc JOIN title_players tp ON tp.title_id = uc.title_id",
      "  WHERE uc.unlocks * 4 < tp.players",
      "), hunters AS (",
      "  SELECT u.gamertag, COUNT(*) AS rare_unlocks",
      "  FROM AchievementUnlock u JOIN rare r ON r.achievement_id = u.achievement_id",
      "  GROUP BY u.gamertag",
      "), ranked AS (",
      "  SELECT gamertag, rare_unlocks, DENSE_RANK() OVER (ORDER BY rare_unlocks DESC) AS hunter_rank",
      "  FROM hunters",
      ")",
      "SELECT gamertag, rare_unlocks, hunter_rank",
      "FROM ranked",
      "WHERE hunter_rank <= 3",
      "ORDER BY hunter_rank, gamertag",
    ].join("\n"),
    alternatives: [
      [
        "WITH hunters AS (",
        "  SELECT u.gamertag, COUNT(*) AS rare_unlocks",
        "  FROM AchievementUnlock u",
        "  JOIN Achievement a ON a.achievement_id = u.achievement_id",
        "  WHERE (SELECT COUNT(*) FROM AchievementUnlock x WHERE x.achievement_id = u.achievement_id) * 4",
        "        < (SELECT COUNT(*) FROM TitlePlayer tp WHERE tp.title_id = a.title_id)",
        "  GROUP BY u.gamertag",
        "), ranked AS (",
        "  SELECT h.gamertag, h.rare_unlocks,",
        "         1 + (SELECT COUNT(DISTINCT h2.rare_unlocks) FROM hunters h2 WHERE h2.rare_unlocks > h.rare_unlocks) AS hunter_rank",
        "  FROM hunters h",
        ")",
        "SELECT gamertag, rare_unlocks, hunter_rank FROM ranked WHERE hunter_rank <= 3 ORDER BY hunter_rank, gamertag",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Rarity is a property of an achievement: compare its unlock count with its title's player count.",
      "\"Fewer than 25%\" in integers is `unlocks * 4 < players` — exactly a quarter is not rare.",
      "Count each gamertag's unlocks of rare achievements, then `DENSE_RANK()` those counts.",
      "Filter on the rank in an outer query; a window function cannot be used in `WHERE` at the same level.",
    ],
    editorial: [
      "Build it in layers. Players per title come from `TitlePlayer`; unlocks per achievement from `AchievementUnlock`. An achievement is rare when `unlocks * 4 < players` — integer arithmetic so the 25% boundary is exact: in the 8-player Halo example, an achievement two players unlocked (25%) is **not** rare, one unlocked by a single player is. An achievement nobody unlocked is rare too, but it gives no one a point.",
      "",
      "Next, each gamertag's count of unlocks among the rare achievements, and then `DENSE_RANK() OVER (ORDER BY rare_unlocks DESC)`: tied hunters share a rank and the next count gets the next number, so \"top 3 ranks\" may return more than three people. `RANK()` would leave gaps after ties and shrink the list; `ROW_NUMBER()` would break ties arbitrarily. The rank filter has to live in an outer query because window results are computed after `WHERE`.",
      "",
      "The alternative tests rarity with two correlated counts per unlock and computes the dense rank as 1 + the number of distinct higher counts — the pre-window formulation.",
    ].join("\n"),
  },

  {
    slug: "microsoft-bing-search-sessions-ending-without-a-click",
    title: "Microsoft: Bing Search Sessions That Ended Without a Click",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Aggregation"],
    description: [
      "A Bing search-quality team looks for **failed search sessions**: the user rephrased the query and still gave up without clicking anything.",
      "",
      "Split each user's events into sessions: events ordered by `event_time` (then `event_id`), and a gap of **more than 30 minutes** since that user's previous event starts a new session (exactly 30 minutes stays in the same one). A session is **unsuccessful** when it has **at least two queries** and its **last event is a query**. For every user, return `user_id`, `sessions` and `unsuccessful_sessions`, ordered by `user_id`.",
    ].join("\n"),
    tables: [
      {
        name: "SearchEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "event_time", type: "datetime" },
          { name: "event_type", type: "enum", values: ["query", "click"] },
        ],
        primaryKey: ["event_id"],
        note: "One row per query typed or result clicked; times are whole minutes, and a user never has two events at the same time.",
      },
    ],
    examples: [
      {
        SearchEvent: [
          [1, 1, "2025-07-01 09:00:00", "query"],
          [2, 1, "2025-07-01 09:01:00", "click"],
          [3, 1, "2025-07-01 09:40:00", "query"],
          [4, 1, "2025-07-01 09:45:00", "query"],
          [5, 1, "2025-07-01 09:50:00", "click"],
          [6, 1, "2025-07-01 10:05:00", "query"],
          [7, 1, "2025-07-01 10:35:00", "query"],
          [8, 2, "2025-07-01 14:00:00", "query"],
          [9, 2, "2025-07-01 14:10:00", "query"],
          [10, 2, "2025-07-01 14:12:00", "click"],
          [11, 2, "2025-07-01 15:00:00", "query"],
          [12, 3, "2025-07-01 20:00:00", "query"],
          [13, 3, "2025-07-01 20:20:00", "query"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (let user = 1, nu = ri(rng, 1, 4); user <= nu; user++) {
        const day = dateBetween(rng, "2025-07-01", "2025-07-05");
        let t = ri(rng, 360, 900);
        for (let s = ri(rng, 1, 3); s > 0; s--) {
          for (let q = ri(rng, 1, 4); q > 0; q--) {
            rows.push([0, user, at(day, t), "query"]);
            t += ri(rng, 1, chance(rng, 0.2) ? 30 : 12);
            if (chance(rng, 0.4)) {
              rows.push([0, user, at(day, t), "click"]);
              t += ri(rng, 1, 15);
            }
          }
          t += chance(rng, 0.15) ? 30 - 1 : ri(rng, 31, 120);
        }
      }
      rows.forEach((r, i) => (r[0] = i + 1));
      return { SearchEvent: rows };
    },
    solution: [
      "WITH gaps AS (",
      "  SELECT e.*, LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time, event_id) AS prev_time",
      "  FROM SearchEvent e",
      "), numbered AS (",
      "  SELECT g.*, SUM(CASE WHEN prev_time IS NULL OR TIMESTAMPDIFF(MINUTE, prev_time, event_time) > 30 THEN 1 ELSE 0 END)",
      "         OVER (PARTITION BY user_id ORDER BY event_time, event_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS session_no",
      "  FROM gaps g",
      "), from_end AS (",
      "  SELECT n.*, ROW_NUMBER() OVER (PARTITION BY user_id, session_no ORDER BY event_time DESC, event_id DESC) AS pos_from_end",
      "  FROM numbered n",
      "), per_session AS (",
      "  SELECT user_id, session_no,",
      "         SUM(CASE WHEN event_type = 'query' THEN 1 ELSE 0 END) AS queries,",
      "         MAX(CASE WHEN pos_from_end = 1 THEN event_type END) AS last_type",
      "  FROM from_end",
      "  GROUP BY user_id, session_no",
      ")",
      "SELECT user_id, COUNT(*) AS sessions,",
      "       SUM(CASE WHEN queries >= 2 AND last_type = 'query' THEN 1 ELSE 0 END) AS unsuccessful_sessions",
      "FROM per_session",
      "GROUP BY user_id",
      "ORDER BY user_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH starts AS (",
        "  SELECT a.user_id, a.event_time AS started_at",
        "  FROM SearchEvent a",
        "  WHERE NOT EXISTS (SELECT 1 FROM SearchEvent b",
        "                    WHERE b.user_id = a.user_id AND b.event_time < a.event_time",
        "                      AND b.event_time >= DATE_SUB(a.event_time, INTERVAL 30 MINUTE))",
        "), tagged AS (",
        "  SELECT e.user_id, e.event_time, e.event_type,",
        "         (SELECT MAX(s.started_at) FROM starts s WHERE s.user_id = e.user_id AND s.started_at <= e.event_time) AS started_at",
        "  FROM SearchEvent e",
        "), per_session AS (",
        "  SELECT user_id, started_at, SUM(CASE WHEN event_type = 'query' THEN 1 ELSE 0 END) AS queries, MAX(event_time) AS last_time",
        "  FROM tagged GROUP BY user_id, started_at",
        ")",
        "SELECT p.user_id, COUNT(*) AS sessions,",
        "       SUM(CASE WHEN p.queries >= 2 AND EXISTS (SELECT 1 FROM tagged t WHERE t.user_id = p.user_id AND t.event_time = p.last_time AND t.event_type = 'query')",
        "                THEN 1 ELSE 0 END) AS unsuccessful_sessions",
        "FROM per_session p",
        "GROUP BY p.user_id",
        "ORDER BY p.user_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`LAG(event_time)` per user gives the gap to the previous event; a gap over 30 minutes (or no previous event) marks a session start.",
      "A running `SUM` of the start flags numbers the sessions.",
      "To find a session's last event, number its events from the end with `ROW_NUMBER() … ORDER BY event_time DESC`.",
      "Count queries per session and check the last event's type, then roll up per user.",
    ],
    editorial: [
      "This is **sessionisation** followed by a per-session test. `LAG(event_time)` over each user's events gives the time since their previous event; the event opens a session when there is no previous event or the gap is more than 30 minutes. A running `SUM` of those 0/1 flags gives every event its session number. User 1's event at 10:35 comes exactly 30 minutes after 10:05, so it stays in the same session — the boundary the statement fixes.",
      "",
      "Each session then needs two facts: how many queries it holds, and what its final event was. `ROW_NUMBER()` ordered by time **descending** marks the last event as position 1, and a conditional `MAX` lifts its type into the session row. A session is unsuccessful when it has two or more queries (the user reformulated) and ends on a query (they never clicked after the last attempt). User 2's lone 15:00 query is a session but not a failed one — a single query with no click is a different signal.",
      "",
      "The alternative finds starts with `NOT EXISTS` (no event in the previous 30 minutes), tags each event with its latest start, and checks the last event with `EXISTS`. Correlated and quadratic per user; the window version is a few sorts.",
    ].join("\n"),
  },

  {
    slug: "microsoft-game-pass-win-back-rate-by-month",
    title: "Microsoft: Game Pass Win-Back Rate by Cancellation Month",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Aggregation"],
    description: [
      "The Xbox Game Pass retention team measures **win-backs**: members who let their membership lapse and came back within 60 days.",
      "",
      "Each member's periods never overlap. When a period ends, look at the member's **next** period: if it starts **0 or 1 day** after the end, the member just switched tier — not a lapse. Otherwise the end is a **lapse**, and it is **won back** when the next period starts **2 to 60 days** after the end (inclusive). An ended period with no next period is a lapse that was not won back. For each month of the lapse's end date (`'YYYY-MM'`), return `lapse_month`, `lapses`, `won_back` and `win_back_pct` (100 × won_back ÷ lapses, rounded to 2 decimals), ordered by `lapse_month`. Periods still running (`ended_on` NULL) are not lapses.",
    ].join("\n"),
    tables: [
      {
        name: "GamePassPeriod",
        columns: [
          { name: "period_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "tier", type: "enum", values: ["Core", "Standard", "Ultimate", "PC"] },
          { name: "started_on", type: "date" },
          { name: "ended_on", type: "date" },
        ],
        primaryKey: ["period_id"],
        note: "One row per continuous membership period on one tier; `ended_on` is NULL for a period still running. A member's periods never overlap, and a new one starts on or after the previous end.",
      },
    ],
    examples: [
      {
        GamePassPeriod: [
          [1, 1, "Core", "2024-01-05", "2024-03-04"],
          [2, 1, "Ultimate", "2024-03-05", "2024-05-10"],
          [3, 1, "Ultimate", "2024-06-20", null],
          [4, 2, "Standard", "2024-02-01", "2024-05-31"],
          [5, 3, "PC", "2024-01-10", "2024-03-15"],
          [6, 3, "PC", "2024-05-14", "2024-07-01"],
          [7, 4, "Core", "2024-01-01", "2024-03-20"],
          [8, 4, "Core", "2024-05-20", null],
          [9, 5, "Standard", "2024-04-01", "2024-05-02"],
          [10, 5, "Ultimate", "2024-05-02", "2024-05-25"],
          [11, 5, "Ultimate", "2024-06-01", null],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (let member = 1, nm = ri(rng, 1, 8); member <= nm && rows.length < 26; member++) {
        let start = dateBetween(rng, "2023-11-01", "2024-03-01");
        for (let k = ri(rng, 1, 4); k > 0; k--) {
          const end = addDays(start, ri(rng, 10, 120));
          const last = k === 1;
          rows.push([rows.length + 1, member, pick(rng, ["Core", "Standard", "Ultimate", "PC"]), start, last && chance(rng, 0.4) ? null : end]);
          start = addDays(end, chance(rng, 0.5) ? pick(rng, [0, 1, 2, 59, 60, 61]) : ri(rng, 3, 150));
        }
      }
      return { GamePassPeriod: rows };
    },
    solution: [
      "WITH with_next AS (",
      "  SELECT member_id, ended_on,",
      "         LEAD(started_on) OVER (PARTITION BY member_id ORDER BY started_on) AS next_start",
      "  FROM GamePassPeriod",
      "), lapses AS (",
      "  SELECT DATE_FORMAT(ended_on, '%Y-%m') AS lapse_month,",
      "         CASE WHEN next_start IS NOT NULL AND DATEDIFF(next_start, ended_on) <= 60 THEN 1 ELSE 0 END AS won",
      "  FROM with_next",
      "  WHERE ended_on IS NOT NULL",
      "    AND (next_start IS NULL OR DATEDIFF(next_start, ended_on) >= 2)",
      ")",
      "SELECT lapse_month, COUNT(*) AS lapses, SUM(won) AS won_back,",
      "       ROUND(100 * SUM(won) / COUNT(*), 2) AS win_back_pct",
      "FROM lapses",
      "GROUP BY lapse_month",
      "ORDER BY lapse_month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT LEFT(p.ended_on, 7) AS lapse_month, COUNT(*) AS lapses,",
        "       SUM(CASE WHEN EXISTS (SELECT 1 FROM GamePassPeriod n WHERE n.member_id = p.member_id",
        "                             AND n.started_on BETWEEN DATE_ADD(p.ended_on, INTERVAL 2 DAY) AND DATE_ADD(p.ended_on, INTERVAL 60 DAY))",
        "                THEN 1 ELSE 0 END) AS won_back,",
        "       ROUND(100 * SUM(CASE WHEN EXISTS (SELECT 1 FROM GamePassPeriod n WHERE n.member_id = p.member_id",
        "                             AND n.started_on BETWEEN DATE_ADD(p.ended_on, INTERVAL 2 DAY) AND DATE_ADD(p.ended_on, INTERVAL 60 DAY))",
        "                THEN 1 ELSE 0 END) / COUNT(*), 2) AS win_back_pct",
        "FROM GamePassPeriod p",
        "WHERE p.ended_on IS NOT NULL",
        "  AND NOT EXISTS (SELECT 1 FROM GamePassPeriod s WHERE s.member_id = p.member_id",
        "                  AND s.started_on BETWEEN p.ended_on AND DATE_ADD(p.ended_on, INTERVAL 1 DAY))",
        "GROUP BY lapse_month",
        "ORDER BY lapse_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "For each period you need the member's next start date — `LEAD(started_on)` per member.",
      "Classify the gap with `DATEDIFF(next_start, ended_on)`: 0–1 is a switch, 2–60 a win-back, more (or no next period) a lost member.",
      "Switches are removed entirely: they are neither lapses nor win-backs.",
      "Group by the month of the end date and compute the rate with decimal division.",
    ],
    editorial: [
      "Everything hinges on pairing each period with the **next** one of the same member, which `LEAD(started_on) OVER (PARTITION BY member_id ORDER BY started_on)` does in one pass. Because periods never overlap and start in order, the next start is the only one that can tell us what happened after an end.",
      "",
      "The gap `DATEDIFF(next_start, ended_on)` then classifies the end. A gap of 0 or 1 day is a tier switch (member 5 moved from Standard to Ultimate on the same day) — removed entirely, because counting it as a lapse would inflate both numerator and denominator. A gap of 2–60 days is a lapse that was won back (member 3 returned after exactly 60 days, inside the window); more than 60, or no next period at all, is a lapse that stayed lost (member 4 came back on day 61). Periods still running are not lapses. Each lapse is bucketed by the month it ended and the rate is `100 * won / lapses`, rounded.",
      "",
      "The alternative replaces `LEAD` with `EXISTS` probes over date windows: no period starting within a day of the end (not a switch), and one starting 2–60 days after (won back).",
    ].join("\n"),
  },
];
