import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, chance, dateBetween, names, pick, ri, sample, shuffle } from "./kit.js";

/**
 * Customer support and IT/DevOps operations: the questions a support lead, an
 * SRE or a platform engineer is asked every week — tickets waiting past their
 * SLA, agent workloads and reopen rates, CSAT, first-response breaches,
 * deployments and the change failure rate, CPU samples, gateway error logs,
 * health checks against an uptime target, latency percentiles, merged outage
 * windows, on-call coverage gaps, API sessions and MTTR medians. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad2 = (n: number) => String(n).padStart(2, "0");
/** A 'YYYY-MM-DD HH:MM:00' on a day between two dates — whole minutes, so minute differences never truncate. */
const stamp = (rng: () => number, from: string, to: string): string =>
  `${dateBetween(rng, from, to)} ${pad2(ri(rng, 0, 23))}:${pad2(ri(rng, 0, 59))}:00`;
/** A 'YYYY-MM-DD HH:MM:SS' plus `minutes`. */
function addMinutes(ts: string, minutes: number): string {
  const d = new Date(Date.parse(`${ts.replace(" ", "T")}Z`) + minutes * 60_000);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
}
/** A 'YYYY-MM-DD HH:MM:SS' plus `seconds`. */
const addSeconds = (ts: string, seconds: number): string => addMinutes(ts, seconds / 60);

const SUBJECTS = [
  "UPI payment debited but order failed", "Cannot log in after update", "Refund not received", "App crashes on launch",
  "GST invoice shows wrong amount", "OTP not delivered", "Order stuck in transit", "Password reset link expired",
  "Account locked", "Charged for the wrong plan",
] as const;
const TEAMS = ["Payments", "Onboarding", "Logistics", "Billing"] as const;
const SERVICES = ["checkout-api", "payments-svc", "search-svc", "auth-svc", "notify-worker", "catalog-api"] as const;
const HOSTS = ["web-01", "web-02", "db-01", "cache-01", "worker-03", "api-02", "search-01"] as const;

export const WORLD_OPS: SqlProblemSpec[] = [
  {
    slug: "urgent-tickets-waiting-past-a-day",
    title: "Urgent Support Tickets Waiting More Than a Day",
    difficulty: "EASY",
    topics: ["Basics", "Dates"],
    description: [
      "The support desk's morning shift starts at **2025-03-10 09:00:00**. Before handing over, the night lead lists every urgent ticket that is still unanswered and has been waiting **more than 24 hours** — created strictly before 2025-03-09 09:00:00. A ticket created exactly 24 hours earlier has not crossed the line yet.",
      "",
      "Return the tickets with `priority` 'urgent' and `status` 'open' or 'pending' that were created more than 24 hours before the shift change, with the columns `ticket_id`, `subject` and `created_at`, **ordered by `created_at`, then `ticket_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "SupportTicket",
        columns: [
          { name: "ticket_id", type: "int" },
          { name: "subject", type: "varchar" },
          { name: "priority", type: "enum", values: ["low", "normal", "high", "urgent"] },
          { name: "status", type: "enum", values: ["open", "pending", "resolved", "closed"] },
          { name: "created_at", type: "datetime" },
        ],
        primaryKey: ["ticket_id"],
        note: "One row per customer ticket. 'pending' means the desk is waiting on another team; resolved and closed tickets need no action.",
      },
    ],
    examples: [
      {
        SupportTicket: [
          [1001, "UPI payment debited but order failed", "urgent", "open", "2025-03-08 22:15:00"],
          [1002, "Cannot log in after update", "urgent", "pending", "2025-03-07 11:40:00"],
          [1003, "Refund not received", "high", "open", "2025-03-07 09:05:00"],
          [1004, "OTP not delivered", "urgent", "resolved", "2025-03-06 18:30:00"],
          [1005, "Account locked", "urgent", "open", "2025-03-09 09:00:00"],
          [1006, "App crashes on launch", "urgent", "open", "2025-03-10 02:10:00"],
          [1007, "GST invoice shows wrong amount", "urgent", "open", "2025-03-08 22:15:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 14);
      const rows = seq(1, n).map((i) => {
        let created = stamp(rng, "2025-03-06", "2025-03-09");
        if (chance(rng, 0.12)) created = "2025-03-09 09:00:00";
        else if (chance(rng, 0.15)) created = `2025-03-10 0${ri(rng, 0, 8)}:${pad2(ri(rng, 0, 59))}:00`;
        else if (created > "2025-03-10 09:00:00") created = "2025-03-09 08:59:00";
        const priority = chance(rng, 0.6) ? "urgent" : pick(rng, ["low", "normal", "high"]);
        const status = chance(rng, 0.7) ? pick(rng, ["open", "pending"]) : pick(rng, ["resolved", "closed"]);
        return [1000 + i, pick(rng, SUBJECTS), priority, status, created];
      });
      // A duplicate creation time now and then, so the ticket_id tie-break is exercised.
      if (rows.length > 2 && chance(rng, 0.4)) rows[1]![4] = rows[0]![4]!;
      return { SupportTicket: shuffle(rng, rows) };
    },
    solution: [
      "SELECT ticket_id, subject, created_at",
      "FROM SupportTicket",
      "WHERE priority = 'urgent'",
      "  AND status IN ('open', 'pending')",
      "  AND created_at < '2025-03-09 09:00:00'",
      "ORDER BY created_at, ticket_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT ticket_id, subject, created_at FROM SupportTicket",
        "WHERE priority = 'urgent' AND status NOT IN ('resolved', 'closed')",
        "  AND TIMESTAMPDIFF(SECOND, created_at, '2025-03-10 09:00:00') > 86400",
        "ORDER BY created_at, ticket_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Three conditions decide a row: the priority, the status and the creation time.",
      "\"More than 24 hours before 09:00 on the 10th\" is the same as \"created before 09:00 on the 9th\" — a plain comparison of datetimes.",
      "Strictly before: a ticket created at exactly 2025-03-09 09:00:00 stays out.",
    ],
    editorial: [
      "This is a filter with three conditions joined by AND. The priority must be 'urgent', the status one of the two that still need work — `IN ('open', 'pending')` reads better than two ORs — and the ticket must have been waiting longer than a day at the shift change.",
      "",
      "The time condition is easiest to write by moving the boundary instead of the column: waiting more than 24 hours at 2025-03-10 09:00:00 means created before 2025-03-09 09:00:00, so `created_at < '2025-03-09 09:00:00'` does it and can use an index on `created_at`. The comparison is strict, so the ticket created on the boundary stays out. Computing the age per row with `TIMESTAMPDIFF(SECOND, created_at, …) > 86400` gives the same rows but must evaluate every ticket — fine here, slower on a large table. Be careful with `TIMESTAMPDIFF(HOUR, …) >= 24`: it truncates to whole hours, so 24 hours and 0 seconds and 24 hours 59 minutes look alike, and the boundary ticket would wrongly come back.",
      "",
      "Two tickets can share a creation time, so the order needs `ticket_id` as a second key to be fixed.",
    ].join("\n"),
  },

  {
    slug: "open-ticket-load-per-support-agent",
    title: "Open Ticket Load per Support Agent",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "Before assigning new tickets, the support manager wants to see how many tickets each agent is **still working on** — tickets whose `status` is 'open' or 'pending'. Resolved and closed tickets are finished work and do not count, and unassigned tickets (`agent_id` NULL) belong to nobody.",
      "",
      "Return **every agent** with the columns `agent_id`, `agent_name` and `open_tickets`; an agent with no open or pending ticket gets 0. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Agent",
        columns: [
          { name: "agent_id", type: "int" },
          { name: "agent_name", type: "varchar" },
          { name: "team", type: "varchar" },
        ],
        primaryKey: ["agent_id"],
        note: "One row per support agent.",
      },
      {
        name: "Ticket",
        columns: [
          { name: "ticket_id", type: "int" },
          { name: "agent_id", type: "int" },
          { name: "status", type: "enum", values: ["open", "pending", "resolved", "closed"] },
        ],
        primaryKey: ["ticket_id"],
        note: "`agent_id` is the assigned agent, or NULL while the ticket sits in the unassigned queue.",
      },
    ],
    examples: [
      {
        Agent: [
          [1, "Priya", "Payments"],
          [2, "Kabir", "Payments"],
          [3, "Sneha", "Billing"],
          [4, "Arjun", "Billing"],
        ],
        Ticket: [
          [501, 1, "open"],
          [502, 1, "pending"],
          [503, 1, "resolved"],
          [504, 2, "closed"],
          [505, 3, "open"],
          [506, null, "open"],
          [507, 2, "resolved"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 8);
      const who = names(rng, n);
      const agents = who.map((name, i) => [i + 1, name, pick(rng, TEAMS)]);
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 20);
      const tickets = seq(501, m).map((id) => [
        id,
        chance(rng, 0.15) ? null : ri(rng, 1, n),
        pick(rng, ["open", "pending", "resolved", "closed", "open"]),
      ]);
      return { Agent: agents, Ticket: tickets };
    },
    solution: [
      "SELECT a.agent_id, a.agent_name, COUNT(t.ticket_id) AS open_tickets",
      "FROM Agent a",
      "LEFT JOIN Ticket t",
      "  ON t.agent_id = a.agent_id AND t.status IN ('open', 'pending')",
      "GROUP BY a.agent_id, a.agent_name",
    ].join("\n"),
    alternatives: [
      "SELECT a.agent_id, a.agent_name, (SELECT COUNT(*) FROM Ticket t WHERE t.agent_id = a.agent_id AND t.status IN ('open', 'pending')) AS open_tickets FROM Agent a",
      [
        "SELECT a.agent_id, a.agent_name,",
        "       COALESCE(SUM(CASE WHEN t.status IN ('open', 'pending') THEN 1 ELSE 0 END), 0) AS open_tickets",
        "FROM Agent a LEFT JOIN Ticket t ON t.agent_id = a.agent_id",
        "GROUP BY a.agent_id, a.agent_name",
      ].join("\n"),
    ],
    hints: [
      "Every agent must appear, even one with nothing assigned — start from `Agent` and keep it whole.",
      "Where you put the status condition matters: in the WHERE clause it throws away the agents whose tickets are all closed.",
      "COUNT of a column of the ticket counts only the rows where a ticket actually matched.",
    ],
    editorial: [
      "The answer has one row per agent, so the query starts from `Agent` and LEFT JOINs the tickets: an agent with no matching ticket still appears once, with NULL in every ticket column.",
      "",
      "The subtle part is the status filter. Put `t.status IN ('open', 'pending')` in the WHERE clause and it runs after the join — on the NULL rows of agents without tickets, and on agents whose tickets are all resolved, the condition is not true and those agents vanish, so they never show their 0. Inside the ON clause the condition only decides which tickets match, and the agent row survives regardless.",
      "",
      "`COUNT(t.ticket_id)` then counts the matched tickets and gives 0 for an agent whose only row is the NULL one — `COUNT(*)` would say 1. Unassigned tickets have `agent_id` NULL, which equals no agent, so they are ignored without extra work. A correlated subquery per agent, or a conditional SUM over an unfiltered LEFT JOIN wrapped in COALESCE, gives the same numbers; all three are one pass with an index on `Ticket.agent_id`.",
    ].join("\n"),
  },

  {
    slug: "hosts-that-hit-cpu-saturation",
    title: "Hosts That Hit CPU Saturation",
    difficulty: "EASY",
    topics: ["Aggregation"],
    description: [
      "The monitoring agent samples every host's CPU usage every five minutes. A sample with `cpu_pct` NULL is one the agent failed to collect. The capacity review flags a host as **saturated** when its highest collected sample is **at least 90.0** percent.",
      "",
      "Return the saturated hosts with the columns `host`, `peak_cpu` (the highest `cpu_pct`) and `samples` (how many non-NULL samples the host has), **ordered by `peak_cpu` descending, then `host` ascending**.",
    ].join("\n"),
    tables: [
      {
        name: "CpuSample",
        columns: [
          { name: "host", type: "varchar" },
          { name: "sampled_at", type: "datetime" },
          { name: "cpu_pct", type: "decimal" },
        ],
        primaryKey: ["host", "sampled_at"],
        note: "One row per host per five-minute sample. `cpu_pct` is 0–100 with one decimal, or NULL when the sample was missed.",
      },
    ],
    examples: [
      {
        CpuSample: [
          ["web-01", "2025-04-02 10:00:00", 72.5],
          ["web-01", "2025-04-02 10:05:00", 93.1],
          ["db-01", "2025-04-02 10:00:00", 90.0],
          ["db-01", "2025-04-02 10:05:00", null],
          ["db-01", "2025-04-02 10:10:00", 61.4],
          ["cache-01", "2025-04-02 10:00:00", 89.9],
          ["api-02", "2025-04-02 10:00:00", 93.1],
          ["api-02", "2025-04-02 10:05:00", 40.2],
          ["api-02", "2025-04-02 10:10:00", 55.0],
        ],
      },
    ],
    gen: (rng) => {
      const hosts = sample(rng, HOSTS, ri(rng, 1, 6));
      const rows: Cell[][] = [];
      const peaks: number[] = [];
      for (const host of hosts) {
        const k = ri(rng, 1, 5);
        for (let s = 0; s < k; s++) {
          let v: number | null = ri(rng, 200, 999) / 10;
          if (chance(rng, 0.1)) v = 90;
          else if (chance(rng, 0.08)) v = 89.9;
          else if (peaks.length && chance(rng, 0.1)) v = pick(rng, peaks);
          if (chance(rng, 0.1)) v = null;
          if (v !== null) peaks.push(v);
          rows.push([host, `2025-04-02 10:${pad2(s * 5)}:00`, v]);
        }
      }
      return { CpuSample: shuffle(rng, rows) };
    },
    solution: [
      "SELECT host, MAX(cpu_pct) AS peak_cpu, COUNT(cpu_pct) AS samples",
      "FROM CpuSample",
      "GROUP BY host",
      "HAVING MAX(cpu_pct) >= 90.0",
      "ORDER BY peak_cpu DESC, host",
    ].join("\n"),
    alternatives: [
      [
        "SELECT host, MAX(cpu_pct) AS peak_cpu, COUNT(cpu_pct) AS samples",
        "FROM CpuSample",
        "WHERE host IN (SELECT host FROM CpuSample WHERE cpu_pct >= 90.0)",
        "GROUP BY host",
        "ORDER BY peak_cpu DESC, host",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "One row per host: group the samples by `host`.",
      "The saturation test is about the group's maximum, so it belongs in HAVING, not WHERE.",
      "`COUNT(column)` skips NULLs; `COUNT(*)` does not.",
    ],
    editorial: [
      "Each output row summarises one host, so the samples are grouped by `host`. `MAX(cpu_pct)` is the host's peak — aggregate functions ignore NULLs, so a missed sample never becomes the peak — and `COUNT(cpu_pct)` counts only the samples that were actually collected, which is what `samples` means; `COUNT(*)` would also count the missed ones.",
      "",
      "The condition \"peak at least 90\" is about a value that exists only after grouping, so it goes in `HAVING MAX(cpu_pct) >= 90.0`. A WHERE clause would instead drop the cool samples before grouping, which leaves the right hosts but the wrong `samples` count. The comparison is inclusive: a host peaking at exactly 90.0 is saturated, one at 89.9 is not.",
      "",
      "Two hosts can peak at the same value, so the order needs `host` as the second key. The alternative finds the saturated hosts with an IN subquery and aggregates only those — the same answer, two passes instead of one.",
    ].join("\n"),
  },

  {
    slug: "deployment-outcomes-per-service",
    title: "Deployment Outcomes per Service",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Aggregation"],
    description: [
      "The release dashboard shows, for every service, how its deployments went. A deployment with `status` 'succeeded' went out cleanly; 'failed' and 'rolled_back' both count as **failed**; a deployment still 'in_progress' counts toward the total but is neither succeeded nor failed.",
      "",
      "Return one row per service that has deployments, with the columns `service`, `total_deploys`, `succeeded` and `failed`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Deployment",
        columns: [
          { name: "deploy_id", type: "int" },
          { name: "service", type: "varchar" },
          { name: "deployed_at", type: "datetime" },
          { name: "status", type: "enum", values: ["succeeded", "failed", "rolled_back", "in_progress"] },
        ],
        primaryKey: ["deploy_id"],
        note: "One row per deployment of a service to production.",
      },
    ],
    examples: [
      {
        Deployment: [
          [1, "checkout-api", "2025-05-05 11:00:00", "succeeded"],
          [2, "checkout-api", "2025-05-06 15:30:00", "rolled_back"],
          [3, "checkout-api", "2025-05-07 10:10:00", "succeeded"],
          [4, "payments-svc", "2025-05-05 12:45:00", "failed"],
          [5, "payments-svc", "2025-05-07 18:20:00", "in_progress"],
          [6, "search-svc", "2025-05-06 09:00:00", "succeeded"],
        ],
      },
    ],
    gen: (rng) => {
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 18);
      const services = sample(rng, SERVICES, ri(rng, 1, 5));
      const rows = seq(1, m).map((id) => [
        id,
        pick(rng, services),
        stamp(rng, "2025-05-01", "2025-05-31"),
        pick(rng, ["succeeded", "succeeded", "succeeded", "failed", "rolled_back", "in_progress"]),
      ]);
      return { Deployment: rows };
    },
    solution: [
      "SELECT service,",
      "       COUNT(*) AS total_deploys,",
      "       SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) AS succeeded,",
      "       SUM(CASE WHEN status IN ('failed', 'rolled_back') THEN 1 ELSE 0 END) AS failed",
      "FROM Deployment",
      "GROUP BY service",
    ].join("\n"),
    alternatives: [
      [
        "SELECT service, COUNT(*) AS total_deploys,",
        "       SUM(IF(status = 'succeeded', 1, 0)) AS succeeded,",
        "       COUNT(*) - SUM(IF(status = 'succeeded', 1, 0)) - SUM(IF(status = 'in_progress', 1, 0)) AS failed",
        "FROM Deployment GROUP BY service",
      ].join("\n"),
      [
        "SELECT service, COUNT(*) AS total_deploys,",
        "       COUNT(CASE WHEN status = 'succeeded' THEN 1 END) AS succeeded,",
        "       COUNT(CASE WHEN status <> 'succeeded' AND status <> 'in_progress' THEN 1 END) AS failed",
        "FROM Deployment GROUP BY service",
      ].join("\n"),
    ],
    hints: [
      "Group by `service`; the total is a plain count of the group.",
      "To count only some rows of a group, turn each row into 1 or 0 with CASE and add them up.",
      "Two statuses map to \"failed\", and one maps to nothing at all.",
    ],
    editorial: [
      "This is **conditional aggregation**: one GROUP BY, several counts that each look at a different subset of the group's rows. `COUNT(*)` is the total. For the others, a CASE turns each row into 1 when it belongs to the bucket and 0 when it does not, and SUM adds them up — `SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END)`.",
      "",
      "The failed bucket takes two statuses, so its CASE tests `status IN ('failed', 'rolled_back')`. A deployment that is still in progress is in the total but in neither bucket, which is why `succeeded + failed` can be less than `total_deploys` — a good check that the buckets were defined as the statement says.",
      "",
      "`COUNT(CASE WHEN … THEN 1 END)` works the same way, because a CASE without ELSE yields NULL and COUNT skips NULLs; `SUM(IF(…))` is MySQL's shorthand. Every form reads the table once.",
    ].join("\n"),
  },

  {
    slug: "error-codes-in-api-gateway-logs",
    title: "Error Codes in the API Gateway Logs",
    difficulty: "EASY",
    topics: ["Strings", "Aggregation"],
    description: [
      "Every line the API gateway writes starts with a code word — 'ERR-504', 'WARN-429', 'INFO-200' — followed by a space and free text. Only a line whose message **starts with** 'ERR-' is an error; a line such as 'INFO-200 retried after ERR-504' was served fine and is not one.",
      "",
      "Count the errors per code. Return the columns `error_code` (the first word of the message, e.g. 'ERR-504') and `occurrences`, **ordered by `occurrences` descending, then `error_code` ascending**.",
    ].join("\n"),
    tables: [
      {
        name: "GatewayLog",
        columns: [
          { name: "log_id", type: "int" },
          { name: "logged_at", type: "datetime" },
          { name: "message", type: "varchar" },
        ],
        primaryKey: ["log_id"],
        note: "One row per log line. Every message is an upper-case code word of the form LEVEL-NNN, one space, and text.",
      },
    ],
    examples: [
      {
        GatewayLog: [
          [1, "2025-06-01 10:00:02", "ERR-504 upstream timed out after 30s"],
          [2, "2025-06-01 10:00:05", "INFO-200 request served"],
          [3, "2025-06-01 10:00:09", "ERR-502 bad gateway from payments-svc"],
          [4, "2025-06-01 10:01:11", "ERR-504 upstream timed out after 30s"],
          [5, "2025-06-01 10:01:30", "INFO-200 retried after ERR-504"],
          [6, "2025-06-01 10:02:44", "WARN-429 client throttled"],
          [7, "2025-06-01 10:03:01", "ERR-500 unhandled exception in handler"],
          [8, "2025-06-01 10:03:15", "ERR-502 bad gateway from search-svc"],
        ],
      },
    ],
    gen: (rng) => {
      const LINES = [
        "ERR-504 upstream timed out after 30s", "ERR-502 bad gateway from payments-svc", "ERR-500 unhandled exception in handler",
        "ERR-503 service unavailable", "ERR-401 token signature invalid", "WARN-429 client throttled", "INFO-200 request served",
        "INFO-200 retried after ERR-504", "WARN-499 client closed request", "INFO-304 served from cache",
      ];
      const pool = sample(rng, LINES, ri(rng, 3, LINES.length));
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      const rows = seq(1, m).map((id) => [id, `2025-06-01 10:${pad2(Math.floor(id * 2.5))}:00`, pick(rng, pool)]);
      return { GatewayLog: rows };
    },
    solution: [
      "SELECT SUBSTRING_INDEX(message, ' ', 1) AS error_code, COUNT(*) AS occurrences",
      "FROM GatewayLog",
      "WHERE message LIKE 'ERR-%'",
      "GROUP BY SUBSTRING_INDEX(message, ' ', 1)",
      "ORDER BY occurrences DESC, error_code",
    ].join("\n"),
    alternatives: [
      [
        "SELECT LEFT(message, LOCATE(' ', message) - 1) AS error_code, COUNT(*) AS occurrences",
        "FROM GatewayLog",
        "WHERE LEFT(message, 4) = 'ERR-'",
        "GROUP BY LEFT(message, LOCATE(' ', message) - 1)",
        "ORDER BY occurrences DESC, error_code",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Which lines are errors is a question about how the message starts — a LIKE pattern anchored at the beginning.",
      "`'%ERR-%'` would also match a line that merely mentions an error later on.",
      "The code is everything before the first space; SUBSTRING_INDEX or LEFT with LOCATE cuts it out.",
    ],
    editorial: [
      "Two string operations do the work. First the filter: `message LIKE 'ERR-%'` keeps the lines whose text **begins** with 'ERR-'. The pattern has no leading `%`, which is the point — `'%ERR-%'` would also catch 'INFO-200 retried after ERR-504', a successful request that only mentions an earlier error. (An anchored LIKE can also use an index on the column; a leading wildcard cannot.)",
      "",
      "Then the key: the code is the first word, so `SUBSTRING_INDEX(message, ' ', 1)` — everything before the first space — gives 'ERR-504'. The same expression goes in GROUP BY, and COUNT(*) counts the lines per code. `LEFT(message, LOCATE(' ', message) - 1)` is the same cut written with a position search.",
      "",
      "Codes can tie on their count, so the order adds `error_code` as a second key. The whole query is one scan of the log.",
    ].join("\n"),
  },

  {
    slug: "incidents-opened-on-a-weekend",
    title: "Production Incidents Opened on a Weekend",
    difficulty: "EASY",
    topics: ["Dates", "Basics"],
    description: [
      "The SRE manager is making the case for a paid weekend on-call rota and wants the incidents that were **opened on a Saturday or a Sunday** (by the date part of `opened_at`; a Friday 23:59 page is still a weekday incident).",
      "",
      "Return the columns `incident_id`, `title` and `opened_day` — the weekday's English name, 'Saturday' or 'Sunday' — **ordered by `opened_at`, then `incident_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "Incident",
        columns: [
          { name: "incident_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "severity", type: "enum", values: ["SEV1", "SEV2", "SEV3"] },
          { name: "opened_at", type: "datetime" },
        ],
        primaryKey: ["incident_id"],
        note: "One row per production incident, with the moment it was declared.",
      },
    ],
    examples: [
      {
        Incident: [
          [41, "Checkout latency above 2s", "SEV2", "2025-02-28 23:59:00"],
          [42, "UPI callbacks failing", "SEV1", "2025-03-01 02:15:00"],
          [43, "Search index stale", "SEV3", "2025-03-02 18:40:00"],
          [44, "Login OTP delays", "SEV2", "2025-03-03 00:00:00"],
          [45, "Notification queue backlog", "SEV3", "2025-03-05 11:20:00"],
          [46, "Payments DB failover", "SEV1", "2025-03-08 07:05:00"],
        ],
      },
    ],
    gen: (rng) => {
      const TITLES = ["Checkout latency above 2s", "UPI callbacks failing", "Search index stale", "Login OTP delays", "Notification queue backlog", "Payments DB failover", "CDN cache misses spiking", "Disk full on worker"];
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 14);
      const rows = seq(41, m).map((id) => {
        let at = stamp(rng, "2025-01-01", "2025-06-30");
        // The edges of the weekend: Friday night and Monday's first minute.
        if (chance(rng, 0.1)) at = "2025-03-07 23:59:00";
        else if (chance(rng, 0.1)) at = "2025-03-10 00:00:00";
        else if (chance(rng, 0.1)) at = "2025-03-09 23:59:00";
        return [id, pick(rng, TITLES), pick(rng, ["SEV1", "SEV2", "SEV3"]), at];
      });
      return { Incident: shuffle(rng, rows) };
    },
    solution: [
      "SELECT incident_id, title, DAYNAME(opened_at) AS opened_day",
      "FROM Incident",
      "WHERE DAYOFWEEK(opened_at) IN (1, 7)",
      "ORDER BY opened_at, incident_id",
    ].join("\n"),
    alternatives: [
      "SELECT incident_id, title, DAYNAME(opened_at) AS opened_day FROM Incident WHERE WEEKDAY(opened_at) >= 5 ORDER BY opened_at, incident_id",
      "SELECT incident_id, title, DAYNAME(opened_at) AS opened_day FROM Incident WHERE DAYNAME(opened_at) IN ('Saturday', 'Sunday') ORDER BY opened_at, incident_id",
    ],
    ordered: true,
    hints: [
      "MySQL can tell you the weekday of a datetime — as a number or as a name.",
      "`DAYOFWEEK` counts Sunday as 1 and Saturday as 7; `WEEKDAY` counts Monday as 0 and Sunday as 6.",
      "The time of day plays no part: only the date decides the weekday.",
    ],
    editorial: [
      "The question is about the **weekday** of each `opened_at`, which a date function answers directly. `DAYOFWEEK(d)` numbers the days from Sunday = 1 to Saturday = 7, so the weekend is `IN (1, 7)`; `WEEKDAY(d)` numbers them from Monday = 0 to Sunday = 6, so the weekend is `>= 5`; and `DAYNAME(d)` gives the English name, which is also what the output column wants. Any of the three works as the filter — just don't mix up the two numbering schemes, the most common bug with these functions.",
      "",
      "The functions look only at the date part, so an incident at Friday 23:59 is a Friday incident and one at Monday 00:00 a Monday incident, exactly as the statement asks.",
      "",
      "Two incidents can be declared in the same minute, so the order uses `incident_id` after `opened_at`. A function on the column prevents an index range scan, but on an incidents table the full scan is cheap.",
    ].join("\n"),
  },

  {
    slug: "on-call-engineers-not-paged-in-march",
    title: "On-Call Engineers Who Were Not Paged in March",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "The platform team reviews its pager load once a month. An alert routed to a team alias rather than a person has `engineer_id` NULL and belongs to nobody.",
      "",
      "Return every engineer who received **no page during March 2025** (from 2025-03-01 00:00:00 up to, not including, 2025-04-01 00:00:00), with the columns `engineer_id` and `name`. Pages in other months do not matter. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Engineer",
        columns: [
          { name: "engineer_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "team", type: "varchar" },
        ],
        primaryKey: ["engineer_id"],
        note: "One row per engineer in the on-call rotation.",
      },
      {
        name: "PageAlert",
        columns: [
          { name: "alert_id", type: "int" },
          { name: "engineer_id", type: "int" },
          { name: "service", type: "varchar" },
          { name: "paged_at", type: "datetime" },
        ],
        primaryKey: ["alert_id"],
        note: "One row per page sent. `engineer_id` is the person paged, or NULL when the page went to a team alias.",
      },
    ],
    examples: [
      {
        Engineer: [
          [1, "Rohan", "Payments"],
          [2, "Aditi", "Payments"],
          [3, "Vikram", "Search"],
          [4, "Zara", "Search"],
          [5, "Harsh", "Platform"],
        ],
        PageAlert: [
          [9001, 1, "payments-svc", "2025-03-04 03:12:00"],
          [9002, 2, "payments-svc", "2025-02-28 23:50:00"],
          [9003, 3, "search-svc", "2025-04-01 00:00:00"],
          [9004, null, "auth-svc", "2025-03-15 14:00:00"],
          [9005, 1, "checkout-api", "2025-03-20 09:30:00"],
          [9006, 4, "search-svc", "2025-03-31 23:59:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 9);
      const who = names(rng, n);
      const engineers = who.map((name, i) => [i + 1, name, pick(rng, TEAMS)]);
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 16);
      const alerts = seq(9001, m).map((id) => {
        let at = stamp(rng, "2025-02-15", "2025-04-15");
        if (chance(rng, 0.1)) at = "2025-04-01 00:00:00";
        else if (chance(rng, 0.1)) at = "2025-03-01 00:00:00";
        else if (chance(rng, 0.08)) at = "2025-02-28 23:59:00";
        return [id, chance(rng, 0.15) ? null : ri(rng, 1, n), pick(rng, SERVICES), at];
      });
      return { Engineer: engineers, PageAlert: alerts };
    },
    solution: [
      "SELECT e.engineer_id, e.name",
      "FROM Engineer e",
      "LEFT JOIN PageAlert p",
      "  ON p.engineer_id = e.engineer_id",
      " AND p.paged_at >= '2025-03-01 00:00:00'",
      " AND p.paged_at < '2025-04-01 00:00:00'",
      "WHERE p.alert_id IS NULL",
    ].join("\n"),
    alternatives: [
      "SELECT engineer_id, name FROM Engineer e WHERE NOT EXISTS (SELECT 1 FROM PageAlert p WHERE p.engineer_id = e.engineer_id AND YEAR(p.paged_at) = 2025 AND MONTH(p.paged_at) = 3)",
      "SELECT engineer_id, name FROM Engineer WHERE engineer_id NOT IN (SELECT engineer_id FROM PageAlert WHERE engineer_id IS NOT NULL AND DATE_FORMAT(paged_at, '%Y-%m') = '2025-03')",
    ],
    hints: [
      "Start from the engineers and look for March pages belonging to each — an anti join.",
      "With a LEFT JOIN, the month condition has to sit in the ON clause; in WHERE it would also throw away the engineers you are looking for.",
      "A page at 2025-04-01 00:00:00 is April's. Use a half-open range: on or after March 1st, before April 1st.",
      "Team-alias pages have a NULL `engineer_id` — think about what that does to a `NOT IN` list.",
    ],
    editorial: [
      "The answer is the engineers with **no matching row** among March's pages: an anti join. The LEFT JOIN form joins every engineer to their pages *from March only* and keeps the engineers for whom nothing matched, detected by the page's primary key being NULL.",
      "",
      "Two details decide whether it is right. The month filter must be part of the ON clause: in the WHERE clause it would run after the join and drop the NULL rows — exactly the engineers without March pages. And the month is a **half-open range**, `>= '2025-03-01 00:00:00' AND < '2025-04-01 00:00:00'`, so a page at midnight on April 1st belongs to April and one at 23:59 on March 31st to March; `BETWEEN '2025-03-01' AND '2025-03-31'` would miss everything after midnight on the 31st.",
      "",
      "`NOT EXISTS` with `YEAR` and `MONTH` says the same thing per engineer. `NOT IN` works only after filtering out the NULL `engineer_id` of team-alias pages: one NULL in the list makes `x NOT IN (…)` unknown for everyone, and the answer would come back empty. With an index on `(engineer_id, paged_at)` each form is one range probe per engineer.",
    ].join("\n"),
  },

  {
    slug: "csat-survey-sentiment-labels",
    title: "Label CSAT Survey Responses by Sentiment",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Basics"],
    description: [
      "After a ticket closes the customer is asked to rate the support on a 1–5 scale. The CX team labels each response: a score of 4 or 5 is a **'promoter'**, 3 is **'neutral'**, 1 or 2 is a **'detractor'**, and a survey that was sent but never answered (`score` NULL) is **'no answer'**.",
      "",
      "Return every response with the columns `response_id`, `ticket_id` and `sentiment`, **ordered by `response_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "CsatResponse",
        columns: [
          { name: "response_id", type: "int" },
          { name: "ticket_id", type: "int" },
          { name: "score", type: "int" },
          { name: "sent_at", type: "datetime" },
        ],
        primaryKey: ["response_id"],
        note: "One survey per closed ticket. `score` is 1–5, or NULL while the customer has not answered.",
      },
    ],
    examples: [
      {
        CsatResponse: [
          [1, 2001, 5, "2025-07-01 10:00:00"],
          [2, 2002, 3, "2025-07-01 11:30:00"],
          [3, 2003, null, "2025-07-01 12:10:00"],
          [4, 2004, 1, "2025-07-02 09:45:00"],
          [5, 2005, 4, "2025-07-02 16:20:00"],
          [6, 2006, 2, "2025-07-03 08:05:00"],
        ],
      },
    ],
    gen: (rng) => {
      const m = chance(rng, 0.04) ? 0 : ri(rng, 1, 15);
      const tickets = sample(rng, seq(2001, 60), m);
      const rows = tickets.map((t, i) => [i + 1, t, chance(rng, 0.2) ? null : ri(rng, 1, 5), stamp(rng, "2025-07-01", "2025-07-31")]);
      return { CsatResponse: rows };
    },
    solution: [
      "SELECT response_id, ticket_id,",
      "       CASE",
      "         WHEN score IS NULL THEN 'no answer'",
      "         WHEN score >= 4 THEN 'promoter'",
      "         WHEN score = 3 THEN 'neutral'",
      "         ELSE 'detractor'",
      "       END AS sentiment",
      "FROM CsatResponse",
      "ORDER BY response_id",
    ].join("\n"),
    alternatives: [
      "SELECT response_id, ticket_id, IF(score IS NULL, 'no answer', IF(score >= 4, 'promoter', IF(score = 3, 'neutral', 'detractor'))) AS sentiment FROM CsatResponse ORDER BY response_id",
      "SELECT response_id, ticket_id, COALESCE(CASE score WHEN 5 THEN 'promoter' WHEN 4 THEN 'promoter' WHEN 3 THEN 'neutral' WHEN 2 THEN 'detractor' WHEN 1 THEN 'detractor' END, 'no answer') AS sentiment FROM CsatResponse ORDER BY response_id",
    ],
    ordered: true,
    hints: [
      "A searched CASE checks its WHEN conditions top to bottom and returns the first one that is true.",
      "Handle NULL first and explicitly: `score >= 4` and `score = 3` are both unknown for a NULL score, so it would fall through to ELSE.",
    ],
    editorial: [
      "Each row is mapped to a label, which is what a **searched CASE** is for. Its WHEN branches are tried in order and the first true one wins, so the ranges can be written as simple thresholds: after `score >= 4` has taken the promoters, `score = 3` takes the neutrals and ELSE is left with 1 and 2.",
      "",
      "The trap is NULL. For an unanswered survey every comparison — `NULL >= 4`, `NULL = 3` — is *unknown*, not false, and CASE treats unknown like false, so without a branch of its own a NULL score would fall into ELSE and be counted as a detractor. Testing `score IS NULL` first gives it the 'no answer' label. The second alternative relies on the same fact the other way round: a simple CASE over the five scores returns NULL for anything it does not list, and COALESCE turns that into 'no answer'.",
      "",
      "Nested `IF` calls are MySQL's shorthand for the same logic. The query reads each row once.",
    ].join("\n"),
  },

  {
    slug: "first-response-sla-breach-rate-by-priority",
    title: "First-Response SLA Breach Rate by Priority",
    difficulty: "MEDIUM",
    topics: ["Dates", "Conditional Logic", "Aggregation"],
    description: [
      "The support SLA promises a first reply within **60 minutes** for an 'urgent' ticket, **240 minutes** for 'high' and **1440 minutes** for 'normal'. A ticket **breaches** when its first response came **more than** its target after `created_at` (a reply exactly on the target is on time), or when it has **no response yet** (`first_response_at` NULL).",
      "",
      "For each priority that has tickets, return the columns `priority`, `tickets`, `breached` and `breach_pct` — `100 * breached / tickets` **rounded to 2 decimals**. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Ticket",
        columns: [
          { name: "ticket_id", type: "int" },
          { name: "priority", type: "enum", values: ["urgent", "high", "normal"] },
          { name: "created_at", type: "datetime" },
          { name: "first_response_at", type: "datetime" },
        ],
        primaryKey: ["ticket_id"],
        note: "Times are whole minutes. `first_response_at` is the agent's first public reply, or NULL if nobody has replied.",
      },
    ],
    examples: [
      {
        Ticket: [
          [1, "urgent", "2025-08-04 10:00:00", "2025-08-04 10:45:00"],
          [2, "urgent", "2025-08-04 11:00:00", "2025-08-04 12:00:00"],
          [3, "urgent", "2025-08-04 12:00:00", "2025-08-04 13:01:00"],
          [4, "high", "2025-08-04 09:00:00", "2025-08-04 14:30:00"],
          [5, "high", "2025-08-04 09:30:00", null],
          [6, "high", "2025-08-04 10:15:00", "2025-08-04 11:00:00"],
          [7, "normal", "2025-08-03 18:00:00", "2025-08-04 17:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const TARGET: Record<string, number> = { urgent: 60, high: 240, normal: 1440 };
      const m = chance(rng, 0.04) ? 0 : ri(rng, 1, 20);
      const prios = sample(rng, ["urgent", "high", "normal"], ri(rng, 1, 3));
      const rows = seq(1, m).map((id) => {
        const p = pick(rng, prios);
        const created = stamp(rng, "2025-08-01", "2025-08-20");
        const t = TARGET[p]!;
        const wait = pick(rng, [t, t + 1, t - 1, ri(rng, 1, t), ri(rng, t, t * 3)]);
        return [id, p, created, chance(rng, 0.12) ? null : addMinutes(created, wait)];
      });
      return { Ticket: rows };
    },
    solution: [
      "WITH flagged AS (",
      "  SELECT priority,",
      "         CASE",
      "           WHEN first_response_at IS NULL THEN 1",
      "           WHEN TIMESTAMPDIFF(MINUTE, created_at, first_response_at) >",
      "                CASE priority WHEN 'urgent' THEN 60 WHEN 'high' THEN 240 ELSE 1440 END THEN 1",
      "           ELSE 0",
      "         END AS breach",
      "  FROM Ticket",
      ")",
      "SELECT priority, COUNT(*) AS tickets, SUM(breach) AS breached,",
      "       ROUND(100 * SUM(breach) / COUNT(*), 2) AS breach_pct",
      "FROM flagged",
      "GROUP BY priority",
    ].join("\n"),
    alternatives: [
      [
        "SELECT t.priority, COUNT(*) AS tickets,",
        "       SUM(CASE WHEN t.first_response_at IS NULL OR TIMESTAMPDIFF(MINUTE, t.created_at, t.first_response_at) > s.target_min THEN 1 ELSE 0 END) AS breached,",
        "       ROUND(100 * SUM(CASE WHEN t.first_response_at IS NULL OR TIMESTAMPDIFF(MINUTE, t.created_at, t.first_response_at) > s.target_min THEN 1 ELSE 0 END) / COUNT(*), 2) AS breach_pct",
        "FROM Ticket t",
        "JOIN (SELECT 'urgent' AS priority, 60 AS target_min UNION ALL SELECT 'high', 240 UNION ALL SELECT 'normal', 1440) s",
        "  ON s.priority = t.priority",
        "GROUP BY t.priority",
      ].join("\n"),
      [
        "SELECT priority, COUNT(*) AS tickets,",
        "       COUNT(*) - SUM(IF(TIMESTAMPDIFF(MINUTE, created_at, first_response_at) <= IF(priority = 'urgent', 60, IF(priority = 'high', 240, 1440)), 1, 0)) AS breached,",
        "       ROUND(100 * (COUNT(*) - SUM(IF(TIMESTAMPDIFF(MINUTE, created_at, first_response_at) <= IF(priority = 'urgent', 60, IF(priority = 'high', 240, 1440)), 1, 0))) / COUNT(*), 2) AS breach_pct",
        "FROM Ticket GROUP BY priority",
      ].join("\n"),
    ],
    hints: [
      "Work out, per ticket, whether it breached — a 1 or a 0 — and only then aggregate.",
      "The target depends on the priority: a CASE, or a tiny lookup table joined in.",
      "`TIMESTAMPDIFF(MINUTE, start, end)` is the wait. Compare it with `>` so a reply exactly on target is on time.",
      "A missing reply is a breach, and `TIMESTAMPDIFF` of a NULL is NULL — handle it before the comparison.",
    ],
    editorial: [
      "Split the work in two: first decide for each ticket whether it breached, then count per priority. The per-ticket flag is a CASE. A NULL `first_response_at` is a breach by definition and gets its own branch, because `TIMESTAMPDIFF(MINUTE, created_at, NULL)` is NULL and any comparison with it is unknown — without that branch the unanswered tickets would silently count as on time. Otherwise the wait in minutes is compared with the priority's target, which a nested `CASE priority WHEN 'urgent' THEN 60 …` supplies. The comparison is strict, so a reply exactly 60 minutes after an urgent ticket is on time.",
      "",
      "With the flag in a CTE, the aggregation is plain: `COUNT(*)` tickets, `SUM(breach)` breaches, and their ratio times 100, rounded to 2 decimals — the rounding keeps MySQL's four-decimal division and other engines in agreement.",
      "",
      "The first alternative keeps the targets as data, joining an inline table of (priority, target) rows — the better design once targets change per customer tier. The second counts the on-time replies and subtracts them from the total: an IF whose condition is NULL yields 0, so unanswered tickets drop out of the on-time count and land in the breaches without a separate test. All three are a single scan.",
    ].join("\n"),
  },

  {
    slug: "agents-with-high-ticket-reopen-rate",
    title: "Support Agents With a High Ticket Reopen Rate",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation"],
    description: [
      "A ticket is **reopened** when the customer replies after it was resolved; the help desk logs that as a 'reopened' event, and a ticket can be reopened more than once. Quality reviews look at each agent's **resolved tickets** (`resolved_at` not NULL) and how many of them were reopened at least once. A reopened ticket that is still unresolved is not one of the agent's resolved tickets.",
      "",
      "Return the agents whose reopen rate is **at least 25%**, with the columns `agent_id`, `agent_name`, `resolved_tickets`, `reopened_tickets` and `reopen_pct` (`100 * reopened_tickets / resolved_tickets`, **rounded to 2 decimals**). Agents with no resolved ticket are left out. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Agent",
        columns: [
          { name: "agent_id", type: "int" },
          { name: "agent_name", type: "varchar" },
        ],
        primaryKey: ["agent_id"],
        note: "One row per support agent.",
      },
      {
        name: "Ticket",
        columns: [
          { name: "ticket_id", type: "int" },
          { name: "agent_id", type: "int" },
          { name: "resolved_at", type: "datetime" },
        ],
        primaryKey: ["ticket_id"],
        note: "Each ticket is owned by one agent. `resolved_at` is the latest resolution, or NULL while the ticket is open.",
      },
      {
        name: "TicketEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "ticket_id", type: "int" },
          { name: "event_type", type: "enum", values: ["created", "commented", "resolved", "reopened"] },
          { name: "event_at", type: "datetime" },
        ],
        primaryKey: ["event_id"],
        note: "The ticket's history, one row per event.",
      },
    ],
    examples: [
      {
        Agent: [
          [1, "Meera"],
          [2, "Karan"],
          [3, "Tanvi"],
        ],
        Ticket: [
          [101, 1, "2025-09-02 12:00:00"],
          [102, 1, "2025-09-03 15:00:00"],
          [103, 1, "2025-09-04 10:00:00"],
          [104, 2, "2025-09-02 18:00:00"],
          [105, 2, null],
          [106, 3, "2025-09-05 11:00:00"],
          [107, 3, "2025-09-05 16:00:00"],
        ],
        TicketEvent: [
          [1, 101, "resolved", "2025-09-01 12:00:00"],
          [2, 101, "reopened", "2025-09-01 20:00:00"],
          [3, 101, "reopened", "2025-09-02 09:00:00"],
          [4, 101, "resolved", "2025-09-02 12:00:00"],
          [5, 104, "commented", "2025-09-02 14:00:00"],
          [6, 105, "reopened", "2025-09-03 10:00:00"],
          [7, 106, "reopened", "2025-09-05 09:00:00"],
          [8, 107, "resolved", "2025-09-05 16:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 6);
      const who = names(rng, n);
      const agents = who.map((name, i) => [i + 1, name]);
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 16);
      const tickets: Cell[][] = [];
      const events: Cell[][] = [];
      let eid = 1;
      const reopenRate = pick(rng, [0.15, 0.3, 0.5]);
      for (let k = 0; k < m; k++) {
        const id = 101 + k;
        const day = dateBetween(rng, "2025-09-01", "2025-09-20");
        tickets.push([id, ri(rng, 1, n), chance(rng, 0.25) ? null : `${day} 18:00:00`]);
        events.push([eid++, id, "created", `${day} 08:00:00`]);
        if (chance(rng, 0.4)) events.push([eid++, id, "commented", `${day} 10:00:00`]);
        if (chance(rng, reopenRate)) {
          events.push([eid++, id, "reopened", `${day} 12:00:00`]);
          if (chance(rng, 0.3)) events.push([eid++, id, "reopened", `${day} 15:00:00`]);
        }
      }
      return { Agent: agents, Ticket: tickets, TicketEvent: events };
    },
    solution: [
      "WITH resolved AS (",
      "  SELECT t.agent_id,",
      "         CASE WHEN EXISTS (SELECT 1 FROM TicketEvent e",
      "                           WHERE e.ticket_id = t.ticket_id AND e.event_type = 'reopened')",
      "              THEN 1 ELSE 0 END AS was_reopened",
      "  FROM Ticket t",
      "  WHERE t.resolved_at IS NOT NULL",
      ")",
      "SELECT a.agent_id, a.agent_name,",
      "       COUNT(*) AS resolved_tickets,",
      "       SUM(r.was_reopened) AS reopened_tickets,",
      "       ROUND(100 * SUM(r.was_reopened) / COUNT(*), 2) AS reopen_pct",
      "FROM resolved r",
      "JOIN Agent a ON a.agent_id = r.agent_id",
      "GROUP BY a.agent_id, a.agent_name",
      "HAVING 100 * SUM(r.was_reopened) >= 25 * COUNT(*)",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.agent_id, a.agent_name,",
        "       COUNT(DISTINCT t.ticket_id) AS resolved_tickets,",
        "       COUNT(DISTINCT e.ticket_id) AS reopened_tickets,",
        "       ROUND(100 * COUNT(DISTINCT e.ticket_id) / COUNT(DISTINCT t.ticket_id), 2) AS reopen_pct",
        "FROM Agent a",
        "JOIN Ticket t ON t.agent_id = a.agent_id AND t.resolved_at IS NOT NULL",
        "LEFT JOIN TicketEvent e ON e.ticket_id = t.ticket_id AND e.event_type = 'reopened'",
        "GROUP BY a.agent_id, a.agent_name",
        "HAVING COUNT(DISTINCT e.ticket_id) * 4 >= COUNT(DISTINCT t.ticket_id)",
      ].join("\n"),
    ],
    hints: [
      "The unit is a resolved ticket: first decide, per resolved ticket, whether it was ever reopened.",
      "A ticket reopened twice is still one reopened ticket — joining the events straight in multiplies rows.",
      "Compare the rate in HAVING, after grouping by agent. Cross-multiplying (`100 * reopened >= 25 * resolved`) avoids any rounding.",
    ],
    editorial: [
      "The rate is per **resolved ticket**, so the first step reduces the event log to one fact per ticket: was there any 'reopened' event? An EXISTS inside a CASE gives a 0/1 flag per resolved ticket, which is immune to tickets reopened several times — joining `TicketEvent` directly would produce one row per reopen and inflate both counts.",
      "",
      "Then group by agent: `COUNT(*)` is the resolved tickets, `SUM(was_reopened)` the reopened ones, and the HAVING keeps the agents at 25% or more. Writing the threshold as `100 * reopened >= 25 * resolved` compares integers, so an agent sitting exactly on 25% is kept with no floating-point doubt; the reported percentage is rounded to 2 decimals. Unresolved tickets are filtered out before grouping, so a reopened ticket that is still open counts for nobody, and an agent with no resolved tickets has no rows at all and is left out.",
      "",
      "The alternative does the LEFT JOIN to the reopen events and repairs the multiplication with `COUNT(DISTINCT …)`: distinct resolved tickets, and distinct tickets that matched a reopen. It is correct but makes the database build and de-duplicate the larger join; the EXISTS form stops at the first reopen per ticket.",
    ].join("\n"),
  },

  {
    slug: "slowest-endpoint-in-each-service",
    title: "Slowest Endpoint in Each Service",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "The performance guild picks one endpoint per service to optimise next sprint: the endpoint with the **highest average latency** in that service's request log. If several endpoints of a service share the highest average, all of them are returned.",
      "",
      "Return the columns `service`, `endpoint`, `requests` (the endpoint's request count) and `avg_latency_ms` — its average `latency_ms` **rounded to 2 decimals** (compare the unrounded averages). Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "ApiRequest",
        columns: [
          { name: "request_id", type: "int" },
          { name: "service", type: "varchar" },
          { name: "endpoint", type: "varchar" },
          { name: "latency_ms", type: "int" },
          { name: "status_code", type: "int" },
        ],
        primaryKey: ["request_id"],
        note: "One row per request served. An endpoint path can exist in more than one service.",
      },
    ],
    examples: [
      {
        ApiRequest: [
          [1, "checkout-api", "/v1/cart", 120, 200],
          [2, "checkout-api", "/v1/cart", 180, 200],
          [3, "checkout-api", "/v1/orders", 340, 200],
          [4, "checkout-api", "/v1/orders", 260, 500],
          [5, "search-svc", "/v1/search", 95, 200],
          [6, "search-svc", "/v1/suggest", 60, 200],
          [7, "search-svc", "/v1/suggest", 130, 200],
          [8, "auth-svc", "/v1/login", 210, 200],
          [9, "auth-svc", "/v1/otp", 150, 200],
          [10, "auth-svc", "/v1/otp", 270, 200],
        ],
      },
    ],
    gen: (rng) => {
      const ENDPOINTS = ["/v1/orders", "/v1/payments", "/v1/search", "/v1/login", "/v1/cart", "/v1/otp"];
      const services = sample(rng, SERVICES, ri(rng, 1, 3));
      const m = chance(rng, 0.04) ? 0 : ri(rng, 1, 26);
      const coarse = chance(rng, 0.5); // coarse latencies make equal averages likely
      const eps = new Map(services.map((s) => [s, sample(rng, ENDPOINTS, ri(rng, 1, 4))]));
      const rows = seq(1, m).map((id) => {
        const s = pick(rng, services);
        return [id, s, pick(rng, eps.get(s)!), coarse ? ri(rng, 1, 4) * 100 : ri(rng, 20, 900), pick(rng, [200, 200, 200, 500, 404])];
      });
      return { ApiRequest: rows };
    },
    solution: [
      "WITH stats AS (",
      "  SELECT service, endpoint, COUNT(*) AS requests, AVG(latency_ms) AS avg_ms",
      "  FROM ApiRequest",
      "  GROUP BY service, endpoint",
      "), ranked AS (",
      "  SELECT service, endpoint, requests, avg_ms,",
      "         RANK() OVER (PARTITION BY service ORDER BY avg_ms DESC) AS rk",
      "  FROM stats",
      ")",
      "SELECT service, endpoint, requests, ROUND(avg_ms, 2) AS avg_latency_ms",
      "FROM ranked",
      "WHERE rk = 1",
    ].join("\n"),
    alternatives: [
      [
        "WITH stats AS (SELECT service, endpoint, COUNT(*) AS requests, SUM(latency_ms) AS total_ms FROM ApiRequest GROUP BY service, endpoint)",
        "SELECT s.service, s.endpoint, s.requests, ROUND(s.total_ms / s.requests, 2) AS avg_latency_ms",
        "FROM stats s",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM stats o",
        "  WHERE o.service = s.service AND o.total_ms * s.requests > s.total_ms * o.requests",
        ")",
      ].join("\n"),
      [
        "WITH stats AS (SELECT service, endpoint, COUNT(*) AS requests, AVG(latency_ms) AS avg_ms FROM ApiRequest GROUP BY service, endpoint)",
        "SELECT service, endpoint, requests, ROUND(avg_ms, 2) AS avg_latency_ms",
        "FROM (SELECT service, endpoint, requests, avg_ms, MAX(avg_ms) OVER (PARTITION BY service) AS best FROM stats) s",
        "WHERE avg_ms = best",
      ].join("\n"),
    ],
    hints: [
      "First reduce the log to one row per (service, endpoint) with its count and average.",
      "Then rank those rows inside each service — a window partitioned by `service`.",
      "RANK gives every endpoint tied on the top average rank 1; ROW_NUMBER would keep only one of them.",
      "Round only for display; compare and rank on the raw averages.",
    ],
    editorial: [
      "Two levels of grouping are involved: requests roll up to endpoints, and endpoints compete within a service. So aggregate first — `GROUP BY service, endpoint` with `COUNT(*)` and `AVG(latency_ms)` — and then compare the endpoint rows of each service.",
      "",
      "A window does the comparison without another join: `RANK() OVER (PARTITION BY service ORDER BY avg_ms DESC)` numbers the endpoints of each service from the slowest, and endpoints with the same average share a rank, so `rk = 1` returns every endpoint tied for slowest — exactly the tie rule. `ROW_NUMBER` would silently pick one of the tied endpoints, and `MAX(avg_ms) OVER (PARTITION BY service)` compared with each row's average (the second alternative) is an equivalent way to keep all of them.",
      "",
      "Rounding is applied only to the displayed column, so two averages that differ in the third decimal are not mistaken for a tie. The first alternative is the pre-window approach: keep an endpoint when no endpoint of the same service has a higher average, tested with NOT EXISTS. It compares averages by cross-multiplying totals and counts (`o.total * s.requests > s.total * o.requests`), so it never compares two divided numbers at all — the safest way to test averages for equality. It is quadratic in the endpoints of a service, which is tiny; the window version aggregates once and sorts each service's handful of endpoints.",
    ].join("\n"),
  },

  {
    slug: "monthly-change-failure-rate",
    title: "Monthly Change Failure Rate of Production Deploys",
    difficulty: "MEDIUM",
    topics: ["Dates", "Conditional Logic", "Aggregation"],
    description: [
      "The change failure rate is one of the four DORA metrics: the share of production deployments that **caused an incident or had to be rolled back** (either flag is enough; a deploy with both is still one failed change).",
      "",
      "For every calendar month that has deployments, return the columns `month` (formatted 'YYYY-MM'), `deployments`, `failed_changes` and `change_failure_pct` — `100 * failed_changes / deployments` **rounded to 2 decimals** — **ordered by `month`**.",
    ].join("\n"),
    tables: [
      {
        name: "ProdDeploy",
        columns: [
          { name: "deploy_id", type: "int" },
          { name: "service", type: "varchar" },
          { name: "deployed_at", type: "datetime" },
          { name: "caused_incident", type: "bool" },
          { name: "rolled_back", type: "bool" },
        ],
        primaryKey: ["deploy_id"],
        note: "One row per production deployment. The two flags are 1 or 0.",
      },
    ],
    examples: [
      {
        ProdDeploy: [
          [1, "checkout-api", "2025-01-08 11:00:00", 0, 0],
          [2, "payments-svc", "2025-01-15 16:20:00", 1, 1],
          [3, "search-svc", "2025-01-31 23:50:00", 0, 1],
          [4, "auth-svc", "2025-02-01 00:10:00", 0, 0],
          [5, "checkout-api", "2025-02-12 10:30:00", 1, 0],
          [6, "catalog-api", "2025-02-20 14:45:00", 0, 0],
          [7, "notify-worker", "2025-02-27 09:15:00", 0, 0],
          [8, "payments-svc", "2025-04-03 12:00:00", 0, 0],
        ],
      },
    ],
    gen: (rng) => {
      const m = chance(rng, 0.04) ? 0 : ri(rng, 1, 22);
      const failRate = pick(rng, [0, 0.15, 0.3, 0.5]);
      const rows = seq(1, m).map((id) => {
        const failed = chance(rng, failRate);
        const kind = ri(rng, 0, 2);
        return [
          id,
          pick(rng, SERVICES),
          chance(rng, 0.1) ? pick(rng, ["2024-12-31 23:59:00", "2025-01-01 00:00:00"]) : stamp(rng, "2024-11-01", "2025-04-30"),
          failed && kind !== 1 ? 1 : 0,
          failed && kind !== 0 ? 1 : 0,
        ];
      });
      return { ProdDeploy: rows };
    },
    solution: [
      "SELECT DATE_FORMAT(deployed_at, '%Y-%m') AS month,",
      "       COUNT(*) AS deployments,",
      "       SUM(CASE WHEN caused_incident = 1 OR rolled_back = 1 THEN 1 ELSE 0 END) AS failed_changes,",
      "       ROUND(100 * SUM(CASE WHEN caused_incident = 1 OR rolled_back = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) AS change_failure_pct",
      "FROM ProdDeploy",
      "GROUP BY DATE_FORMAT(deployed_at, '%Y-%m')",
      "ORDER BY month",
    ].join("\n"),
    alternatives: [
      [
        "WITH d AS (",
        "  SELECT CONCAT(YEAR(deployed_at), '-', LPAD(MONTH(deployed_at), 2, '0')) AS month,",
        "         GREATEST(caused_incident, rolled_back) AS failed",
        "  FROM ProdDeploy",
        ")",
        "SELECT month, COUNT(*) AS deployments, SUM(failed) AS failed_changes,",
        "       ROUND(100 * SUM(failed) / COUNT(*), 2) AS change_failure_pct",
        "FROM d GROUP BY month ORDER BY month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Bucket every deployment by its calendar month — a formatted date makes a good group key and sorts correctly as text.",
      "A failed change is \"either flag set\": count each deployment once, not once per flag.",
      "Only months with deployments appear; there is no need to invent the empty ones.",
    ],
    editorial: [
      "**Date bucketing** plus **conditional aggregation**. `DATE_FORMAT(deployed_at, '%Y-%m')` turns every timestamp into its month key, '2025-01'; grouping by that expression puts each deployment in its month, and because the key is zero-padded year-then-month it also sorts chronologically as text, so `ORDER BY month` is correct.",
      "",
      "Inside a month, `COUNT(*)` is the number of deployments and a CASE that is 1 when `caused_incident = 1 OR rolled_back = 1` marks the failed changes. Adding the two flags would count a deploy that both caused an incident and was rolled back twice; the OR (or `GREATEST` of the two flags, as in the alternative) counts it once. The rate is `100 * failed / deployments`, rounded to 2 decimals so the four-decimal division of MySQL and the floating division of other engines print the same number.",
      "",
      "Months with no deployment have no rows and therefore no group — they are simply absent, which the statement allows. The alternative builds the key with `CONCAT`, `YEAR` and `LPAD(MONTH(…), 2, '0')`; without the padding '2025-10' would sort before '2025-9'. One scan and a small sort either way.",
    ].join("\n"),
  },

  {
    slug: "agents-above-their-team-average-workload",
    title: "Agents Carrying More Than Their Team's Average Workload",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation", "Joins"],
    description: [
      "To rebalance queues, the support manager compares every agent's **open workload** — tickets with `status` 'open' or 'pending' — with the **average open workload of the agents in the same team**. Every agent of the team counts in that average, including agents with no open ticket (they count as 0).",
      "",
      "Return the agents whose open workload is **strictly greater** than their team's average, with the columns `agent_id`, `agent_name`, `team` and `open_tickets`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Agent",
        columns: [
          { name: "agent_id", type: "int" },
          { name: "agent_name", type: "varchar" },
          { name: "team", type: "varchar" },
        ],
        primaryKey: ["agent_id"],
        note: "One row per support agent and the team they sit in.",
      },
      {
        name: "Ticket",
        columns: [
          { name: "ticket_id", type: "int" },
          { name: "agent_id", type: "int" },
          { name: "status", type: "enum", values: ["open", "pending", "resolved", "closed"] },
        ],
        primaryKey: ["ticket_id"],
        note: "`agent_id` is the assigned agent (always one of `Agent`).",
      },
    ],
    examples: [
      {
        Agent: [
          [1, "Ananya", "Payments"],
          [2, "Dev", "Payments"],
          [3, "Ira", "Payments"],
          [4, "Nikhil", "Billing"],
          [5, "Simran", "Billing"],
        ],
        Ticket: [
          [1, 1, "open"],
          [2, 1, "pending"],
          [3, 1, "open"],
          [4, 2, "open"],
          [5, 2, "resolved"],
          [6, 3, "closed"],
          [7, 4, "open"],
          [8, 5, "pending"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 9);
      const who = names(rng, n);
      const teams = sample(rng, TEAMS, ri(rng, 1, 3));
      const agents = who.map((name, i) => [i + 1, name, pick(rng, teams)]);
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 24);
      const tickets = seq(1, m).map((id) => [id, ri(rng, 1, n), pick(rng, ["open", "pending", "resolved", "closed", "open"])]);
      return { Agent: agents, Ticket: tickets };
    },
    solution: [
      "WITH workload AS (",
      "  SELECT a.agent_id, a.agent_name, a.team, COUNT(t.ticket_id) AS open_tickets",
      "  FROM Agent a",
      "  LEFT JOIN Ticket t ON t.agent_id = a.agent_id AND t.status IN ('open', 'pending')",
      "  GROUP BY a.agent_id, a.agent_name, a.team",
      ")",
      "SELECT w.agent_id, w.agent_name, w.team, w.open_tickets",
      "FROM workload w",
      "WHERE w.open_tickets > (SELECT AVG(x.open_tickets) FROM workload x WHERE x.team = w.team)",
    ].join("\n"),
    alternatives: [
      [
        "SELECT agent_id, agent_name, team, open_tickets",
        "FROM (",
        "  SELECT a.agent_id, a.agent_name, a.team, COUNT(t.ticket_id) AS open_tickets,",
        "         AVG(COUNT(t.ticket_id)) OVER (PARTITION BY a.team) AS team_avg",
        "  FROM Agent a",
        "  LEFT JOIN Ticket t ON t.agent_id = a.agent_id AND t.status IN ('open', 'pending')",
        "  GROUP BY a.agent_id, a.agent_name, a.team",
        ") s",
        "WHERE open_tickets > team_avg",
      ].join("\n"),
      [
        "WITH workload AS (",
        "  SELECT a.agent_id, a.agent_name, a.team,",
        "         (SELECT COUNT(*) FROM Ticket t WHERE t.agent_id = a.agent_id AND t.status IN ('open', 'pending')) AS open_tickets",
        "  FROM Agent a",
        "), team_total AS (",
        "  SELECT team, SUM(open_tickets) AS total, COUNT(*) AS agents FROM workload GROUP BY team",
        ")",
        "SELECT w.agent_id, w.agent_name, w.team, w.open_tickets",
        "FROM workload w JOIN team_total tt ON tt.team = w.team",
        "WHERE w.open_tickets * tt.agents > tt.total",
      ].join("\n"),
    ],
    hints: [
      "Build the per-agent open count first — with a LEFT JOIN so idle agents keep their 0.",
      "The average must include the zeros, so it has to be taken over that per-agent result, not over the tickets.",
      "Compare each agent with the average of their own team: a correlated subquery or a window partitioned by team.",
    ],
    editorial: [
      "The comparison has two levels, so build them one at a time. The CTE computes each agent's open workload: a LEFT JOIN with the status test in the ON clause, then `COUNT(t.ticket_id)`, so an agent with no open ticket still appears with 0. That matters, because those zeros are part of the team average — averaging over the tickets instead would leave idle agents out and inflate it.",
      "",
      "With one row per agent, the team average is the AVG of `open_tickets` over the rows with the same team. A **correlated subquery** in the WHERE clause computes it for each agent's team and the comparison is strict, so an agent exactly on the average is not returned (a team where everyone carries the same load returns nobody).",
      "",
      "A window does the same in one pass: `AVG(COUNT(t.ticket_id)) OVER (PARTITION BY a.team)` averages the grouped counts per team, which is legal because window functions run after GROUP BY. The third form keeps exact integers: an agent is above the average when `open_tickets * agents_in_team > team_total`, which avoids division altogether. All are linear in agents plus tickets with an index on `Ticket.agent_id`.",
    ].join("\n"),
  },

  {
    slug: "customers-contacting-support-again-within-a-week",
    title: "Customers Contacting Support Again Within a Week",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "A **repeat contact** is a ticket whose customer's **previous ticket** was created at most **7 calendar days** earlier (by date: `DATEDIFF` of the two creation times is between 0 and 7). A customer's tickets are ordered by `created_at`, then `ticket_id`; a customer's first ticket has no previous one and is never a repeat contact.",
      "",
      "Return every repeat contact with the columns `customer_id`, `ticket_id`, `previous_ticket_id` and `days_apart` (that DATEDIFF), **ordered by `customer_id`, then `ticket_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "Ticket",
        columns: [
          { name: "ticket_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "created_at", type: "datetime" },
          { name: "category", type: "varchar" },
        ],
        primaryKey: ["ticket_id"],
        note: "One row per ticket. Ticket ids are not in creation order — tickets imported from email get their id later.",
      },
    ],
    examples: [
      {
        Ticket: [
          [11, 501, "2025-10-01 09:00:00", "Refund"],
          [14, 501, "2025-10-08 22:00:00", "Refund"],
          [19, 501, "2025-10-20 10:00:00", "Login"],
          [12, 502, "2025-10-03 12:00:00", "Delivery"],
          [13, 503, "2025-10-05 08:30:00", "Payment"],
          [10, 503, "2025-10-05 18:00:00", "Payment"],
          [16, 503, "2025-10-12 07:00:00", "Payment"],
          [15, 502, "2025-10-11 12:00:00", "Delivery"],
        ],
      },
    ],
    gen: (rng) => {
      const CATS = ["Refund", "Login", "Delivery", "Payment", "KYC"];
      const customers = sample(rng, seq(501, 12), ri(rng, 1, 5));
      const m = chance(rng, 0.04) ? 0 : ri(rng, 1, 18);
      const ids = sample(rng, seq(10, 60), m);
      const rows: Cell[][] = [];
      let last = "";
      for (const id of ids) {
        const c = pick(rng, customers);
        // Sometimes a ticket a few days after the previous one generated, sometimes the same instant.
        let at = stamp(rng, "2025-10-01", "2025-11-15");
        if (last && chance(rng, 0.25)) at = addMinutes(last, pick(rng, [0, 60 * 24 * 7, 60 * 24 * 7 + 600, 60 * 24 * 8, 90]));
        last = at;
        rows.push([id, c, at, pick(rng, CATS)]);
      }
      return { Ticket: rows };
    },
    solution: [
      "WITH ordered AS (",
      "  SELECT customer_id, ticket_id, created_at,",
      "         LAG(ticket_id) OVER (PARTITION BY customer_id ORDER BY created_at, ticket_id) AS previous_ticket_id,",
      "         LAG(created_at) OVER (PARTITION BY customer_id ORDER BY created_at, ticket_id) AS previous_at",
      "  FROM Ticket",
      ")",
      "SELECT customer_id, ticket_id, previous_ticket_id, DATEDIFF(created_at, previous_at) AS days_apart",
      "FROM ordered",
      "WHERE previous_ticket_id IS NOT NULL",
      "  AND DATEDIFF(created_at, previous_at) <= 7",
      "ORDER BY customer_id, ticket_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.customer_id, c.ticket_id, p.ticket_id AS previous_ticket_id, DATEDIFF(c.created_at, p.created_at) AS days_apart",
        "FROM Ticket c",
        "JOIN Ticket p",
        "  ON p.customer_id = c.customer_id",
        " AND (p.created_at < c.created_at OR (p.created_at = c.created_at AND p.ticket_id < c.ticket_id))",
        "WHERE DATEDIFF(c.created_at, p.created_at) <= 7",
        "  AND NOT EXISTS (",
        "    SELECT 1 FROM Ticket q",
        "    WHERE q.customer_id = c.customer_id",
        "      AND (q.created_at > p.created_at OR (q.created_at = p.created_at AND q.ticket_id > p.ticket_id))",
        "      AND (q.created_at < c.created_at OR (q.created_at = c.created_at AND q.ticket_id < c.ticket_id))",
        "  )",
        "ORDER BY c.customer_id, c.ticket_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "\"The previous ticket of the same customer\" is a row-to-row comparison inside a group — LAG over a window partitioned by customer.",
      "Order the window by `created_at` and then `ticket_id`, so two tickets created at the same instant still have a fixed order.",
      "`DATEDIFF` counts calendar days between the date parts, ignoring the time of day.",
      "Filter on the LAG result outside the window query — window functions cannot appear in WHERE.",
    ],
    editorial: [
      "Each ticket has to be compared with the customer's ticket just before it, which is what **LAG** gives: partition by `customer_id`, order by `created_at` and then `ticket_id` (two tickets can be created in the same second, and the tie-break makes \"previous\" well defined), and read the previous row's id and creation time. Ticket ids are deliberately not in time order, so ordering by id alone would pair the wrong tickets.",
      "",
      "Window functions are computed after WHERE, so the filter goes in an outer query: drop each customer's first ticket (its LAG is NULL) and keep the pairs whose `DATEDIFF(created_at, previous_at)` is at most 7. DATEDIFF works on the date parts only — 1 October 09:00 to 8 October 22:00 is 7 days, a repeat contact, even though more than 168 hours passed. Two tickets on the same day are 0 days apart.",
      "",
      "Before window functions this was a self join to every earlier ticket of the customer with a NOT EXISTS that rules out any ticket in between — the alternative. It returns the same pairs but is quadratic per customer; LAG needs one sort of the table by (customer, time).",
    ].join("\n"),
  },

  {
    slug: "services-missing-their-uptime-target",
    title: "Services Missing Their Uptime Target",
    difficulty: "MEDIUM",
    topics: ["Joins", "Conditional Logic", "Aggregation"],
    description: [
      "The status page probes every service and records 'up', 'degraded' or 'down'. A probe counts as **available** when it is 'up' or 'degraded'. Each service's tier sets its uptime target: **99%** for 'gold', **95%** for 'silver', **90%** for 'bronze'. A service **misses** its target when its share of available probes is **below** the target; exactly on target is a pass. Services with no probes are not reported.",
      "",
      "Return the services that missed, with the columns `service_name`, `tier`, `checks` and `uptime_pct` (`100 * available / checks`, **rounded to 2 decimals**), **ordered by `uptime_pct` ascending, then `service_name`**.",
    ].join("\n"),
    tables: [
      {
        name: "Service",
        columns: [
          { name: "service_id", type: "int" },
          { name: "service_name", type: "varchar" },
          { name: "tier", type: "enum", values: ["gold", "silver", "bronze"] },
        ],
        primaryKey: ["service_id"],
        note: "One row per service on the status page. Names are unique.",
      },
      {
        name: "HealthCheck",
        columns: [
          { name: "check_id", type: "int" },
          { name: "service_id", type: "int" },
          { name: "checked_at", type: "datetime" },
          { name: "status", type: "enum", values: ["up", "degraded", "down"] },
        ],
        primaryKey: ["check_id"],
        note: "One row per probe result.",
      },
    ],
    examples: [
      {
        Service: [
          [1, "checkout-api", "gold"],
          [2, "search-svc", "silver"],
          [3, "notify-worker", "bronze"],
          [4, "catalog-api", "silver"],
          [5, "auth-svc", "gold"],
        ],
        HealthCheck: [
          [1, 1, "2025-11-01 00:00:00", "up"],
          [2, 1, "2025-11-01 00:05:00", "degraded"],
          [3, 1, "2025-11-01 00:10:00", "down"],
          [4, 2, "2025-11-01 00:00:00", "up"],
          [5, 2, "2025-11-01 00:05:00", "up"],
          [6, 3, "2025-11-01 00:00:00", "down"],
          [7, 3, "2025-11-01 00:05:00", "up"],
          [8, 4, "2025-11-01 00:00:00", "down"],
          [9, 4, "2025-11-01 00:05:00", "up"],
        ],
      },
    ],
    gen: (rng) => {
      const svc = sample(rng, SERVICES, ri(rng, 1, 5));
      const services = svc.map((name, i) => [i + 1, name, pick(rng, ["gold", "silver", "bronze"])]);
      const checks: Cell[][] = [];
      let cid = 1;
      for (const [id] of services) {
        if (chance(rng, 0.15)) continue;
        // Ten or twenty probes put 90% and 95% exactly within reach.
        const k = pick(rng, [10, 20, ri(rng, 1, 6)]);
        const down = pick(rng, [0, 0, 1, 2, ri(rng, 0, k)]);
        const slots = new Set(sample(rng, seq(0, k), down));
        for (let s = 0; s < k; s++) {
          const status = slots.has(s) ? "down" : chance(rng, 0.2) ? "degraded" : "up";
          checks.push([cid++, id!, `2025-11-01 ${pad2(Math.floor(s / 12))}:${pad2((s % 12) * 5)}:00`, status]);
        }
      }
      return { Service: services, HealthCheck: shuffle(rng, checks) };
    },
    solution: [
      "SELECT s.service_name, s.tier, COUNT(*) AS checks,",
      "       ROUND(100 * SUM(CASE WHEN h.status IN ('up', 'degraded') THEN 1 ELSE 0 END) / COUNT(*), 2) AS uptime_pct",
      "FROM Service s",
      "JOIN HealthCheck h ON h.service_id = s.service_id",
      "GROUP BY s.service_id, s.service_name, s.tier",
      "HAVING 100 * SUM(CASE WHEN h.status IN ('up', 'degraded') THEN 1 ELSE 0 END)",
      "     < COUNT(*) * CASE s.tier WHEN 'gold' THEN 99 WHEN 'silver' THEN 95 ELSE 90 END",
      "ORDER BY uptime_pct, s.service_name",
    ].join("\n"),
    alternatives: [
      [
        "WITH avail AS (",
        "  SELECT service_id, COUNT(*) AS checks, SUM(IF(status <> 'down', 1, 0)) AS available",
        "  FROM HealthCheck GROUP BY service_id",
        ")",
        "SELECT s.service_name, s.tier, a.checks, ROUND(100 * a.available / a.checks, 2) AS uptime_pct",
        "FROM avail a",
        "JOIN Service s ON s.service_id = a.service_id",
        "JOIN (SELECT 'gold' AS tier, 99 AS target UNION ALL SELECT 'silver', 95 UNION ALL SELECT 'bronze', 90) t ON t.tier = s.tier",
        "WHERE 100 * a.available < t.target * a.checks",
        "ORDER BY uptime_pct, s.service_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Per service: count the probes and the available ones (a conditional count).",
      "The target depends on the tier — bring it in with a CASE, or join a small table of tiers and targets.",
      "Compare without dividing: `100 * available < target * checks` keeps exactly-on-target services out without rounding doubts.",
    ],
    editorial: [
      "Group the probes by service and count two things: all probes, and the available ones — a `SUM(CASE WHEN status IN ('up', 'degraded') THEN 1 ELSE 0 END)`. The inner JOIN to the probes means a service with no probes produces no group, which is what the statement asks for.",
      "",
      "The target is a property of the tier, so it can be written inline as `CASE s.tier WHEN 'gold' THEN 99 …` (the tier is a grouped column, so HAVING may use it) or kept as data in a small derived table joined on the tier, as the alternative does. The comparison is done by cross-multiplying — `100 * available < target * checks` — rather than comparing a computed percentage: 19 available probes out of 20 is exactly 95%, and the integer form leaves that silver service passing with no chance of a rounding error turning it into a miss. The displayed `uptime_pct` is rounded to 2 decimals.",
      "",
      "The order is by the rounded percentage and then by name, which is unique, so it is fully determined. One scan of the probes and a join to the small service table.",
    ].join("\n"),
  },

  {
    slug: "error-counts-by-region-from-hostnames",
    title: "Error Counts by Region and Environment From Hostnames",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation"],
    description: [
      "Every log line records the full hostname of the machine that wrote it, always in three dot-separated parts: `<node>.<region>.<environment>`, for example 'api-07.ap-south-1.prod'. The node name and the region contain hyphens but never dots.",
      "",
      "Count the lines with `level` 'ERROR' per region and environment. Return the columns `region`, `environment` and `errors`, only for combinations with at least one error, **ordered by `errors` descending, then `region`, then `environment`**.",
    ].join("\n"),
    tables: [
      {
        name: "ErrorLog",
        columns: [
          { name: "log_id", type: "int" },
          { name: "hostname", type: "varchar" },
          { name: "level", type: "enum", values: ["ERROR", "WARN", "INFO"] },
          { name: "logged_at", type: "datetime" },
        ],
        primaryKey: ["log_id"],
        note: "One row per log line shipped to the central log store. All names are lower case.",
      },
    ],
    examples: [
      {
        ErrorLog: [
          [1, "api-07.ap-south-1.prod", "ERROR", "2025-12-01 10:00:00"],
          [2, "api-03.ap-south-1.prod", "ERROR", "2025-12-01 10:00:04"],
          [3, "worker-1.ap-south-1.staging", "ERROR", "2025-12-01 10:01:00"],
          [4, "api-07.eu-west-1.prod", "WARN", "2025-12-01 10:01:30"],
          [5, "db-02.eu-west-1.prod", "ERROR", "2025-12-01 10:02:10"],
          [6, "web-11.us-east-1.prod", "INFO", "2025-12-01 10:02:45"],
          [7, "web-11.us-east-1.prod", "ERROR", "2025-12-01 10:03:00"],
          [8, "api-07.ap-south-1.prod", "INFO", "2025-12-01 10:03:20"],
        ],
      },
    ],
    gen: (rng) => {
      const NODES = ["api-07", "api-03", "web-11", "db-02", "worker-1", "cache-4"];
      const REGIONS = ["ap-south-1", "ap-southeast-1", "eu-west-1", "us-east-1"];
      const ENVS = ["prod", "staging", "dev"];
      const regions = sample(rng, REGIONS, ri(rng, 1, 3));
      const envs = sample(rng, ENVS, ri(rng, 1, 2));
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 24);
      const rows = seq(1, m).map((id) => [
        id,
        `${pick(rng, NODES)}.${pick(rng, regions)}.${pick(rng, envs)}`,
        pick(rng, ["ERROR", "ERROR", "WARN", "INFO"]),
        `2025-12-01 10:${pad2(id)}:00`,
      ]);
      return { ErrorLog: rows };
    },
    solution: [
      "SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(hostname, '.', 2), '.', -1) AS region,",
      "       SUBSTRING_INDEX(hostname, '.', -1) AS environment,",
      "       COUNT(*) AS errors",
      "FROM ErrorLog",
      "WHERE level = 'ERROR'",
      "GROUP BY SUBSTRING_INDEX(SUBSTRING_INDEX(hostname, '.', 2), '.', -1), SUBSTRING_INDEX(hostname, '.', -1)",
      "ORDER BY errors DESC, region, environment",
    ].join("\n"),
    alternatives: [
      [
        "WITH parts AS (",
        "  SELECT hostname, LOCATE('.', hostname) AS d1, LOCATE('.', hostname, LOCATE('.', hostname) + 1) AS d2",
        "  FROM ErrorLog WHERE level = 'ERROR'",
        ")",
        "SELECT SUBSTRING(hostname, d1 + 1, d2 - d1 - 1) AS region, SUBSTRING(hostname, d2 + 1) AS environment, COUNT(*) AS errors",
        "FROM parts",
        "GROUP BY region, environment",
        "ORDER BY errors DESC, region, environment",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The region is the text between the first and the second dot; the environment is everything after the last dot.",
      "`SUBSTRING_INDEX(s, '.', n)` keeps everything before the n-th dot; a negative n counts from the right.",
      "Filter to errors first, then group by the two extracted parts.",
    ],
    editorial: [
      "The hostname packs three fields into one string, so the work is cutting it at the dots. `SUBSTRING_INDEX(s, delim, n)` is made for it: with a positive `n` it returns everything before the n-th delimiter, with a negative one everything after the n-th delimiter from the right. The environment is the last part, `SUBSTRING_INDEX(hostname, '.', -1)`. The region is in the middle, so it takes two cuts: `SUBSTRING_INDEX(hostname, '.', 2)` gives 'api-07.ap-south-1', and the last part of *that* is 'ap-south-1'.",
      "",
      "With both parts extracted, it is an ordinary aggregation: keep `level = 'ERROR'` lines, group by the two expressions and count. Filtering in WHERE before grouping is what makes combinations with no errors disappear; the alternative positions also only exist for error lines. The hyphens in the region names are harmless, because only dots are delimiters.",
      "",
      "The alternative finds the two dot positions with `LOCATE` (its third argument starts the search after the first dot) and slices with `SUBSTRING` — more arithmetic, same result. Both read the log once; in a real log store you would extract these fields at ingestion and index them rather than parse strings at query time.",
    ].join("\n"),
  },

  {
    slug: "agent-csat-rank-within-team",
    title: "Agent CSAT Rank Within Each Support Team",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "Each team lead ranks their agents by customer satisfaction. An agent's CSAT is the average of their **answered** survey scores (`score` not NULL); only agents with **at least 3 answered responses** are ranked. Within a team the agent with the highest average is rank 1; agents with **equal averages share a rank** and the next rank follows without a gap (1, 1, 2).",
      "",
      "Return the columns `team`, `agent_name`, `responses` (answered responses), `avg_csat` (the average **rounded to 2 decimals**; rank on the unrounded value) and `team_rank`, **ordered by `team`, then `team_rank`, then `agent_name`**.",
    ].join("\n"),
    tables: [
      {
        name: "Agent",
        columns: [
          { name: "agent_id", type: "int" },
          { name: "agent_name", type: "varchar" },
          { name: "team", type: "varchar" },
        ],
        primaryKey: ["agent_id"],
        note: "One row per support agent. Names are unique.",
      },
      {
        name: "CsatSurvey",
        columns: [
          { name: "survey_id", type: "int" },
          { name: "agent_id", type: "int" },
          { name: "score", type: "int" },
        ],
        primaryKey: ["survey_id"],
        note: "One survey per closed ticket, credited to the agent who closed it. `score` is 1–5, or NULL if the customer never answered.",
      },
    ],
    examples: [
      {
        Agent: [
          [1, "Aisha", "Payments"],
          [2, "Farhan", "Payments"],
          [3, "Pooja", "Payments"],
          [4, "Riya", "Logistics"],
          [5, "Vivaan", "Logistics"],
        ],
        CsatSurvey: [
          [1, 1, 5], [2, 1, 4], [3, 1, 3],
          [4, 2, 4], [5, 2, 4], [6, 2, 4], [7, 2, null],
          [8, 3, 5], [9, 3, 5],
          [10, 4, 2], [11, 4, 5], [12, 4, 4], [13, 4, 3],
          [14, 5, 3], [15, 5, 3], [16, 5, 4],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 7);
      const who = names(rng, n);
      const teams = sample(rng, TEAMS, ri(rng, 1, 3));
      const agents = who.map((name, i) => [i + 1, name, pick(rng, teams)]);
      const surveys: Cell[][] = [];
      let sid = 1;
      // Some agents get a copy of another agent's scores, so averages tie.
      const scoreSets: (number | null)[][] = [];
      for (let a = 1; a <= n; a++) {
        let scores: (number | null)[];
        if (scoreSets.length && chance(rng, 0.25)) scores = [...pick(rng, scoreSets)];
        else scores = seq(0, ri(rng, 0, 5)).map(() => (chance(rng, 0.15) ? null : ri(rng, 1, 5)));
        scoreSets.push(scores);
        for (const s of scores) surveys.push([sid++, a, s]);
      }
      return { Agent: agents, CsatSurvey: shuffle(rng, surveys) };
    },
    solution: [
      "WITH scored AS (",
      "  SELECT a.team, a.agent_name, COUNT(*) AS responses, AVG(s.score) AS avg_raw",
      "  FROM Agent a",
      "  JOIN CsatSurvey s ON s.agent_id = a.agent_id",
      "  WHERE s.score IS NOT NULL",
      "  GROUP BY a.agent_id, a.team, a.agent_name",
      "  HAVING COUNT(*) >= 3",
      ")",
      "SELECT team, agent_name, responses, ROUND(avg_raw, 2) AS avg_csat,",
      "       DENSE_RANK() OVER (PARTITION BY team ORDER BY avg_raw DESC) AS team_rank",
      "FROM scored",
      "ORDER BY team, team_rank, agent_name",
    ].join("\n"),
    alternatives: [
      [
        "WITH scored AS (",
        "  SELECT a.team, a.agent_name, COUNT(s.score) AS responses, SUM(s.score) AS total",
        "  FROM Agent a JOIN CsatSurvey s ON s.agent_id = a.agent_id",
        "  GROUP BY a.agent_id, a.team, a.agent_name",
        "  HAVING COUNT(s.score) >= 3",
        ")",
        "SELECT x.team, x.agent_name, x.responses, ROUND(x.total / x.responses, 2) AS avg_csat,",
        "       1 + (SELECT COUNT(*) FROM (SELECT DISTINCT y.team, y.total * 1000000 DIV y.responses AS key6 FROM scored y) d",
        "            WHERE d.team = x.team AND d.key6 > x.total * 1000000 DIV x.responses) AS team_rank",
        "FROM scored x",
        "ORDER BY x.team, team_rank, x.agent_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Aggregate per agent first: the answered responses and their average, keeping only agents with three or more.",
      "`AVG` and `COUNT(score)` skip NULLs on their own; `COUNT(*)` does not.",
      "Rank inside each team with a window partitioned by `team` — and pick the ranking function whose ties leave no gap.",
    ],
    editorial: [
      "First collapse the surveys to one row per agent: join `Agent` to `CsatSurvey`, drop unanswered surveys, and compute `COUNT(*)` and `AVG(score)`. The HAVING clause keeps agents with at least three answered responses — a filter on the group, so it cannot go in WHERE. (Without the WHERE, `COUNT(s.score)` and `AVG(s.score)` would still skip NULLs, as the alternative shows, but `COUNT(*)` would not.)",
      "",
      "Then rank within each team: `DENSE_RANK() OVER (PARTITION BY team ORDER BY avg_raw DESC)`. Of the three ranking functions it is the one the statement describes — equal averages share a rank and the next one follows without a gap. `RANK` would leave a gap (1, 1, 3) and `ROW_NUMBER` would break the tie arbitrarily. Ranking on the raw average, not the rounded one, matters when two averages differ only in the third decimal.",
      "",
      "The alternative computes the dense rank by hand: one plus the number of distinct higher averages in the team, comparing averages as integers scaled by a million so that no division result is compared for equality. It is quadratic per team; the window needs one sort of the per-agent rows.",
    ].join("\n"),
  },

  {
    slug: "peak-ticket-hour-for-each-weekday",
    title: "Peak Ticket Hour for Each Day of the Week",
    difficulty: "MEDIUM",
    topics: ["Dates", "Window Functions"],
    description: [
      "Workforce planning needs to know when tickets arrive. For each day of the week that has tickets, find the **hour of the day** (0–23, from `created_at`) in which the most tickets were created on that weekday, counting across all weeks. If two hours tie, take the **earlier hour**.",
      "",
      "Return the columns `weekday` (the English day name, e.g. 'Monday'), `peak_hour` and `tickets` (tickets in that hour), **ordered from Monday to Sunday**.",
    ].join("\n"),
    tables: [
      {
        name: "Ticket",
        columns: [
          { name: "ticket_id", type: "int" },
          { name: "channel", type: "enum", values: ["email", "chat", "phone", "whatsapp"] },
          { name: "created_at", type: "datetime" },
        ],
        primaryKey: ["ticket_id"],
        note: "One row per ticket, with the moment it was created.",
      },
    ],
    examples: [
      {
        Ticket: [
          [1, "chat", "2025-06-02 10:15:00"],
          [2, "email", "2025-06-02 10:50:00"],
          [3, "chat", "2025-06-09 10:05:00"],
          [4, "phone", "2025-06-09 14:30:00"],
          [5, "whatsapp", "2025-06-04 09:10:00"],
          [6, "chat", "2025-06-04 18:20:00"],
          [7, "email", "2025-06-07 22:40:00"],
          [8, "chat", "2025-06-14 22:05:00"],
          [9, "chat", "2025-06-14 11:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const m = chance(rng, 0.04) ? 0 : ri(rng, 1, 26);
      const hours = sample(rng, seq(8, 14), ri(rng, 2, 5));
      const rows = seq(1, m).map((id) => [
        id,
        pick(rng, ["email", "chat", "phone", "whatsapp"]),
        `${dateBetween(rng, "2025-06-01", "2025-06-28")} ${pad2(pick(rng, hours))}:${pad2(ri(rng, 0, 59))}:00`,
      ]);
      return { Ticket: rows };
    },
    solution: [
      "WITH hourly AS (",
      "  SELECT WEEKDAY(created_at) AS wd, DAYNAME(created_at) AS weekday, HOUR(created_at) AS hr, COUNT(*) AS tickets",
      "  FROM Ticket",
      "  GROUP BY WEEKDAY(created_at), DAYNAME(created_at), HOUR(created_at)",
      "), ranked AS (",
      "  SELECT wd, weekday, hr, tickets,",
      "         ROW_NUMBER() OVER (PARTITION BY wd ORDER BY tickets DESC, hr) AS rn",
      "  FROM hourly",
      ")",
      "SELECT weekday, hr AS peak_hour, tickets",
      "FROM ranked",
      "WHERE rn = 1",
      "ORDER BY wd",
    ].join("\n"),
    alternatives: [
      [
        "WITH hourly AS (",
        "  SELECT WEEKDAY(created_at) AS wd, DAYNAME(created_at) AS weekday, HOUR(created_at) AS hr, COUNT(*) AS tickets",
        "  FROM Ticket GROUP BY WEEKDAY(created_at), DAYNAME(created_at), HOUR(created_at)",
        ")",
        "SELECT h.weekday, h.hr AS peak_hour, h.tickets",
        "FROM hourly h",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM hourly o",
        "  WHERE o.wd = h.wd AND (o.tickets > h.tickets OR (o.tickets = h.tickets AND o.hr < h.hr))",
        ")",
        "ORDER BY h.wd",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Count tickets per (weekday, hour) first — weekday and hour both come from date functions on `created_at`.",
      "Then keep the best hour per weekday: a ROW_NUMBER partitioned by weekday, ordered by the count and then the hour.",
      "`DAYNAME` sorts alphabetically; to go Monday to Sunday, order by `WEEKDAY` (Monday = 0).",
    ],
    editorial: [
      "Two steps: bucket, then pick the top bucket per group. The buckets are (weekday, hour) pairs: `WEEKDAY(created_at)`, `DAYNAME(created_at)` and `HOUR(created_at)` in the GROUP BY, with `COUNT(*)` per bucket. Tickets from different weeks fall into the same bucket because only the weekday, not the date, is part of the key.",
      "",
      "To keep one hour per weekday, number the buckets inside each weekday with `ROW_NUMBER() OVER (PARTITION BY wd ORDER BY tickets DESC, hr)` and keep number 1. The second sort key implements the tie rule — among equally busy hours the earlier one comes first — and makes the answer deterministic; `RANK` would return every tied hour.",
      "",
      "The output order is by the numeric weekday, not by its name: `DAYNAME` values sort alphabetically (Friday before Monday). Carrying `WEEKDAY` through the query gives a key that runs Monday = 0 to Sunday = 6. The alternative keeps a bucket when no other bucket of the same weekday beats it — more tickets, or as many tickets in an earlier hour. With at most 7 × 24 buckets either form is instant once the tickets are grouped.",
    ].join("\n"),
  },

  {
    slug: "p90-api-latency-per-endpoint",
    title: "90th Percentile API Latency per Endpoint",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "The SRE dashboard reports each endpoint's **p90 latency** by the **nearest-rank** method: sort the endpoint's latencies ascending; the p90 is the value at position **⌈0.9 × n⌉** (1-based), where n is the number of latencies. For 10 requests that is the 9th value, for 11 the 10th, for 1 the only one. Requests with `latency_ms` NULL timed out at the client and are **not** counted. Endpoints with no counted request are left out.",
      "",
      "Return the columns `endpoint`, `requests` (the counted requests, n) and `p90_latency_ms`, **ordered by `endpoint`**.",
    ].join("\n"),
    tables: [
      {
        name: "ApiLatency",
        columns: [
          { name: "request_id", type: "int" },
          { name: "endpoint", type: "varchar" },
          { name: "latency_ms", type: "int" },
          { name: "requested_at", type: "datetime" },
        ],
        primaryKey: ["request_id"],
        note: "One row per request in the sampling window. `latency_ms` is NULL when the client gave up waiting.",
      },
    ],
    examples: [
      {
        ApiLatency: [
          [1, "/v1/orders", 120, "2025-07-14 10:00:00"],
          [2, "/v1/orders", 80, "2025-07-14 10:00:01"],
          [3, "/v1/orders", 95, "2025-07-14 10:00:02"],
          [4, "/v1/orders", 400, "2025-07-14 10:00:03"],
          [5, "/v1/orders", 110, "2025-07-14 10:00:04"],
          [6, "/v1/orders", null, "2025-07-14 10:00:05"],
          [7, "/v1/search", 60, "2025-07-14 10:00:06"],
          [8, "/v1/search", 60, "2025-07-14 10:00:07"],
          [9, "/v1/login", 230, "2025-07-14 10:00:08"],
          [10, "/v1/payments", null, "2025-07-14 10:00:09"],
        ],
      },
    ],
    gen: (rng) => {
      const ENDPOINTS = ["/v1/orders", "/v1/payments", "/v1/search", "/v1/login", "/v1/cart"];
      const eps = sample(rng, ENDPOINTS, ri(rng, 1, 4));
      const m = chance(rng, 0.04) ? 0 : ri(rng, 1, 30);
      const coarse = chance(rng, 0.4);
      const rows = seq(1, m).map((id) => [
        id,
        pick(rng, eps),
        chance(rng, 0.1) ? null : coarse ? ri(rng, 1, 5) * 50 : ri(rng, 30, 1500),
        addSeconds("2025-07-14 10:00:00", id * 7),
      ]);
      return { ApiLatency: rows };
    },
    solution: [
      "WITH ranked AS (",
      "  SELECT endpoint, latency_ms,",
      "         ROW_NUMBER() OVER (PARTITION BY endpoint ORDER BY latency_ms) AS pos,",
      "         COUNT(*) OVER (PARTITION BY endpoint) AS n",
      "  FROM ApiLatency",
      "  WHERE latency_ms IS NOT NULL",
      ")",
      "SELECT endpoint, n AS requests, latency_ms AS p90_latency_ms",
      "FROM ranked",
      "WHERE pos = (9 * n + 9) DIV 10",
      "ORDER BY endpoint",
    ].join("\n"),
    alternatives: [
      [
        "WITH cnt AS (",
        "  SELECT endpoint, COUNT(*) AS n FROM ApiLatency WHERE latency_ms IS NOT NULL GROUP BY endpoint",
        ")",
        "SELECT c.endpoint, c.n AS requests, MIN(a.latency_ms) AS p90_latency_ms",
        "FROM cnt c",
        "JOIN ApiLatency a ON a.endpoint = c.endpoint AND a.latency_ms IS NOT NULL",
        "WHERE 10 * (SELECT COUNT(*) FROM ApiLatency b WHERE b.endpoint = a.endpoint AND b.latency_ms <= a.latency_ms) >= 9 * c.n",
        "GROUP BY c.endpoint, c.n",
        "ORDER BY c.endpoint",
      ].join("\n"),
      [
        "WITH ranked AS (",
        "  SELECT endpoint, latency_ms,",
        "         CUME_DIST() OVER (PARTITION BY endpoint ORDER BY latency_ms) AS cd,",
        "         COUNT(*) OVER (PARTITION BY endpoint) AS n",
        "  FROM ApiLatency WHERE latency_ms IS NOT NULL",
        ")",
        "SELECT endpoint, MIN(n) AS requests, MIN(latency_ms) AS p90_latency_ms",
        "FROM ranked",
        "WHERE cd * 10 >= 9 - 0.0000001",
        "GROUP BY endpoint",
        "ORDER BY endpoint",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Number each endpoint's latencies in ascending order, and attach the endpoint's count to every row — both are window functions over the same partition.",
      "⌈0.9 × n⌉ can be computed in integers: `(9 * n + 9) DIV 10`. That avoids any floating-point doubt about 0.9 × 10.",
      "Equal latencies don't matter: whichever of them lands on the position, the value is the same.",
      "Another view of nearest rank: the smallest latency with at least 90% of the values at or below it.",
    ],
    editorial: [
      "Percentiles are an ordering question, so window functions do the heavy lifting. In one pass over the non-NULL latencies, `ROW_NUMBER() OVER (PARTITION BY endpoint ORDER BY latency_ms)` gives each value its 1-based position and `COUNT(*) OVER (PARTITION BY endpoint)` puts n on every row. The nearest-rank p90 is the row whose position is ⌈0.9n⌉, written in integer arithmetic as `(9 * n + 9) DIV 10` — 9 for n = 10, 10 for n = 11, 1 for n = 1. Computing `CEIL(0.9 * n)` in floating point is a classic trap: 0.9 is not exact in binary, and a product a hair above an integer rounds up to the wrong position.",
      "",
      "Ties in latency are harmless: ROW_NUMBER breaks them in some order, but every candidate for the position holds the same value. NULL latencies are filtered out before the windows run, so they affect neither the positions nor n, and an endpoint whose every request timed out has no rows and drops out.",
      "",
      "The first alternative is the definition stated as a filter: the smallest latency `v` such that at least 90% of the endpoint's values are ≤ v (`10 * count(≤ v) >= 9 * n`). It is quadratic per endpoint. The second uses `CUME_DIST`, which is exactly the fraction of values ≤ the current one, and keeps the smallest value at or above 0.9, with a tiny tolerance for the floating-point fraction. The ROW_NUMBER version needs one sort per endpoint.",
    ].join("\n"),
  },

  {
    slug: "longest-clean-deploy-streak-per-service",
    title: "Longest Streak of Clean Deploys per Service",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins"],
    description: [
      "A service's deployments, taken in time order (by `deployed_at`, then `deploy_id`), form streaks of consecutive 'succeeded' deploys; any 'failed' or 'rolled_back' deploy ends a streak. The platform team celebrates the services with the **longest clean streak**.",
      "",
      "For every service that has deployments, return the columns `service`, `total_deploys` and `longest_streak` — the length of its longest run of consecutive succeeded deploys, **0** if none ever succeeded — **ordered by `longest_streak` descending, then `service`**.",
    ].join("\n"),
    tables: [
      {
        name: "ServiceDeploy",
        columns: [
          { name: "deploy_id", type: "int" },
          { name: "service", type: "varchar" },
          { name: "deployed_at", type: "datetime" },
          { name: "status", type: "enum", values: ["succeeded", "failed", "rolled_back"] },
        ],
        primaryKey: ["deploy_id"],
        note: "One row per finished production deploy. Two deploys of one service can share a timestamp (a re-run in the same second); `deploy_id` orders them.",
      },
    ],
    examples: [
      {
        ServiceDeploy: [
          [1, "checkout-api", "2025-03-03 10:00:00", "succeeded"],
          [2, "checkout-api", "2025-03-04 10:00:00", "succeeded"],
          [3, "checkout-api", "2025-03-05 10:00:00", "rolled_back"],
          [4, "checkout-api", "2025-03-06 10:00:00", "succeeded"],
          [5, "checkout-api", "2025-03-07 10:00:00", "succeeded"],
          [6, "checkout-api", "2025-03-08 10:00:00", "succeeded"],
          [7, "payments-svc", "2025-03-03 12:00:00", "failed"],
          [8, "payments-svc", "2025-03-04 12:00:00", "failed"],
          [9, "search-svc", "2025-03-05 09:00:00", "succeeded"],
          [10, "search-svc", "2025-03-06 09:00:00", "failed"],
          [11, "search-svc", "2025-03-07 09:00:00", "succeeded"],
          [12, "search-svc", "2025-03-07 09:00:00", "succeeded"],
          [13, "search-svc", "2025-03-08 09:00:00", "succeeded"],
        ],
      },
    ],
    gen: (rng) => {
      const services = sample(rng, SERVICES, ri(rng, 1, 4));
      const rows: Cell[][] = [];
      let id = 1;
      for (const s of services) {
        if (chance(rng, 0.1)) continue;
        const k = ri(rng, 1, 9);
        const okRate = pick(rng, [0, 0.5, 0.75, 0.9]);
        let at = stamp(rng, "2025-03-01", "2025-03-05");
        for (let j = 0; j < k; j++) {
          rows.push([id++, s, at, chance(rng, okRate) ? "succeeded" : pick(rng, ["failed", "rolled_back"])]);
          if (!chance(rng, 0.15)) at = addMinutes(at, ri(rng, 60, 60 * 30));
        }
      }
      return { ServiceDeploy: shuffle(rng, rows) };
    },
    solution: [
      "WITH ordered AS (",
      "  SELECT service, status,",
      "         ROW_NUMBER() OVER (PARTITION BY service ORDER BY deployed_at, deploy_id) AS rn_all,",
      "         ROW_NUMBER() OVER (PARTITION BY service, status ORDER BY deployed_at, deploy_id) AS rn_status",
      "  FROM ServiceDeploy",
      "), streaks AS (",
      "  SELECT service, rn_all - rn_status AS island, COUNT(*) AS len",
      "  FROM ordered",
      "  WHERE status = 'succeeded'",
      "  GROUP BY service, rn_all - rn_status",
      "), totals AS (",
      "  SELECT service, COUNT(*) AS total_deploys FROM ServiceDeploy GROUP BY service",
      ")",
      "SELECT t.service, t.total_deploys, COALESCE(MAX(s.len), 0) AS longest_streak",
      "FROM totals t",
      "LEFT JOIN streaks s ON s.service = t.service",
      "GROUP BY t.service, t.total_deploys",
      "ORDER BY longest_streak DESC, t.service",
    ].join("\n"),
    alternatives: [
      [
        "WITH marked AS (",
        "  SELECT service, status,",
        "         SUM(CASE WHEN status = 'succeeded' THEN 0 ELSE 1 END)",
        "           OVER (PARTITION BY service ORDER BY deployed_at, deploy_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS breaks",
        "  FROM ServiceDeploy",
        "), runs AS (",
        "  SELECT service, breaks, SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) AS len, COUNT(*) AS rows_in_group",
        "  FROM marked GROUP BY service, breaks",
        ")",
        "SELECT service, SUM(rows_in_group) AS total_deploys, MAX(len) AS longest_streak",
        "FROM runs",
        "GROUP BY service",
        "ORDER BY longest_streak DESC, service",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "This is gaps and islands: a streak is an island of consecutive succeeded rows in each service's time order.",
      "Number every deploy within its service, and separately within (service, status). For a run of equal statuses the difference of the two numbers stays constant.",
      "Alternatively, a running count of failures so far gives every succeeded deploy the id of the streak it belongs to.",
      "Services that never succeeded still need a row with 0 — start from all services, not from the streaks.",
    ],
    editorial: [
      "Consecutive runs inside an ordered sequence are the **gaps-and-islands** pattern. Order each service's deploys by `deployed_at` and then `deploy_id` (two deploys can share a second, and the id fixes their order). Number every deploy in that order (`rn_all`) and, separately, number it among the deploys of the same service with the same status (`rn_status`). Inside a run of consecutive succeeded deploys both counters grow by one per row, so `rn_all - rn_status` is constant; a failure in between advances `rn_all` but not the succeeded counter, so the next run gets a different key. Grouping the succeeded rows by (service, key) yields one row per streak with its length.",
      "",
      "A service whose every deploy failed has no streak rows at all. Starting from the per-service totals and LEFT JOINing the streaks keeps it, and `COALESCE(MAX(len), 0)` turns its missing maximum into 0.",
      "",
      "The alternative labels streaks with a running count of failures: `SUM(non-success) OVER (… ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` stays constant across a run of successes and steps up at each failure. Each group then holds at most one failure followed by a streak, so counting its succeeded rows gives the streak length, a group of only failures gives 0, and summing the group sizes recovers the total — no join needed. The explicit ROWS frame matters: with ties in the ORDER BY, the default RANGE frame would include peers. Both approaches sort each service once.",
    ].join("\n"),
  },

  {
    slug: "merged-outage-minutes-per-service",
    title: "Total Outage Minutes per Service With Overlaps Merged",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "Several monitors can open an outage for the same service at once, so a service's outage records often **overlap** — one can even sit entirely inside another. For the monthly availability report, the outages of a service are merged into **windows**: two outages belong to the same window when they overlap or **touch** (one ends at the minute the other starts). Outages still in progress (`ended_at` NULL) are ignored.",
      "",
      "For each service with at least one finished outage, return the columns `service`, `outage_windows` (the number of merged windows) and `downtime_minutes` (the sum of the windows' lengths in minutes, end minus start), **ordered by `downtime_minutes` descending, then `service`**.",
    ].join("\n"),
    tables: [
      {
        name: "Outage",
        columns: [
          { name: "outage_id", type: "int" },
          { name: "service", type: "varchar" },
          { name: "started_at", type: "datetime" },
          { name: "ended_at", type: "datetime" },
        ],
        primaryKey: ["outage_id"],
        note: "One row per outage opened by a monitor. Times are whole minutes; a finished outage ends after it starts. `ended_at` is NULL while it is still open.",
      },
    ],
    examples: [
      {
        Outage: [
          [1, "payments-svc", "2025-04-10 10:00:00", "2025-04-10 10:30:00"],
          [2, "payments-svc", "2025-04-10 10:20:00", "2025-04-10 11:00:00"],
          [3, "payments-svc", "2025-04-10 10:40:00", "2025-04-10 10:50:00"],
          [4, "payments-svc", "2025-04-10 14:00:00", "2025-04-10 14:15:00"],
          [5, "search-svc", "2025-04-10 09:00:00", "2025-04-10 09:45:00"],
          [6, "search-svc", "2025-04-10 09:45:00", "2025-04-10 10:00:00"],
          [7, "auth-svc", "2025-04-10 08:00:00", "2025-04-10 08:20:00"],
          [8, "auth-svc", "2025-04-10 12:00:00", null],
          [9, "notify-worker", "2025-04-10 16:00:00", null],
        ],
      },
    ],
    gen: (rng) => {
      const services = sample(rng, SERVICES, ri(rng, 1, 3));
      const rows: Cell[][] = [];
      let id = 1;
      for (const s of services) {
        const k = ri(rng, 0, 6);
        let cursor = `2025-04-10 0${ri(rng, 0, 5)}:00:00`;
        for (let j = 0; j < k; j++) {
          const start = cursor;
          const len = ri(rng, 1, 12) * 10;
          rows.push([id++, s, start, chance(rng, 0.1) ? null : addMinutes(start, len)]);
          // Next outage: inside this one, touching its end, overlapping it, or after a gap.
          const move = pick(rng, ["inside", "touch", "overlap", "gap", "gap"]);
          cursor = addMinutes(start, move === "inside" ? ri(rng, 0, len - 1) : move === "touch" ? len : move === "overlap" ? ri(rng, 1, len) : len + ri(rng, 1, 90));
        }
      }
      return { Outage: shuffle(rng, rows) };
    },
    solution: [
      "WITH done AS (",
      "  SELECT outage_id, service, started_at, ended_at FROM Outage WHERE ended_at IS NOT NULL",
      "), marked AS (",
      "  SELECT outage_id, service, started_at, ended_at,",
      "         MAX(ended_at) OVER (PARTITION BY service ORDER BY started_at, outage_id",
      "                             ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS prev_end",
      "  FROM done",
      "), grouped AS (",
      "  SELECT service, started_at, ended_at,",
      "         SUM(CASE WHEN prev_end IS NULL OR started_at > prev_end THEN 1 ELSE 0 END)",
      "           OVER (PARTITION BY service ORDER BY started_at, outage_id",
      "                 ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS window_no",
      "  FROM marked",
      "), windows AS (",
      "  SELECT service, window_no, MIN(started_at) AS w_start, MAX(ended_at) AS w_end",
      "  FROM grouped",
      "  GROUP BY service, window_no",
      ")",
      "SELECT service, COUNT(*) AS outage_windows, SUM(TIMESTAMPDIFF(MINUTE, w_start, w_end)) AS downtime_minutes",
      "FROM windows",
      "GROUP BY service",
      "ORDER BY downtime_minutes DESC, service",
    ].join("\n"),
    alternatives: [
      [
        "WITH done AS (",
        "  SELECT service, started_at, ended_at FROM Outage WHERE ended_at IS NOT NULL",
        "), starts AS (",
        "  SELECT DISTINCT a.service, a.started_at AS s FROM done a",
        "  WHERE NOT EXISTS (SELECT 1 FROM done b WHERE b.service = a.service AND b.started_at < a.started_at AND b.ended_at >= a.started_at)",
        "), ends AS (",
        "  SELECT DISTINCT a.service, a.ended_at AS e FROM done a",
        "  WHERE NOT EXISTS (SELECT 1 FROM done b WHERE b.service = a.service AND b.started_at <= a.ended_at AND b.ended_at > a.ended_at)",
        "), s2 AS (",
        "  SELECT service, s, ROW_NUMBER() OVER (PARTITION BY service ORDER BY s) AS k FROM starts",
        "), e2 AS (",
        "  SELECT service, e, ROW_NUMBER() OVER (PARTITION BY service ORDER BY e) AS k FROM ends",
        ")",
        "SELECT s2.service, COUNT(*) AS outage_windows, SUM(TIMESTAMPDIFF(MINUTE, s2.s, e2.e)) AS downtime_minutes",
        "FROM s2 JOIN e2 ON e2.service = s2.service AND e2.k = s2.k",
        "GROUP BY s2.service",
        "ORDER BY downtime_minutes DESC, s2.service",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Sort each service's finished outages by start. An outage opens a new window only if it starts after every earlier outage has ended.",
      "\"Every earlier outage has ended\" is a running maximum of `ended_at` over the preceding rows — a window with a ROWS frame ending at 1 PRECEDING.",
      "A running sum of the \"opens a new window\" flags numbers the windows; then MIN(start) and MAX(end) per window give its extent.",
      "Touching counts as overlapping: compare with `>`, not `>=`.",
    ],
    editorial: [
      "Summing each outage's length would count overlapping minutes twice, so the outages must first be **merged into windows** — the classic interval-merging problem. Sort a service's finished outages by `started_at` (and `outage_id`, so equal starts have a fixed order). Walking down that list, an outage starts a new window exactly when it begins after **every** earlier outage has ended; comparing with only the previous row is not enough, because a long outage can cover several later short ones. The running maximum `MAX(ended_at) OVER (… ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)` is that \"latest end so far\", and the test `started_at > prev_end` uses `>` so an outage starting at the minute another ends joins it, as the statement says.",
      "",
      "A running SUM of those 0/1 flags gives every outage the number of its window, so grouping by it yields each window's `MIN(started_at)` and `MAX(ended_at)`; `TIMESTAMPDIFF(MINUTE, …)` measures it, and a final GROUP BY per service counts and sums the windows. In-progress outages are filtered out first and never extend anything.",
      "",
      "The alternative finds the window boundaries directly: a start is a window start when no other outage covers it (`b.started_at < s <= b.ended_at`), an end is a window end when no outage continues past it (`b.started_at <= e < b.ended_at`). Starts and ends then pair up in order — the k-th start with the k-th end. It is quadratic per service; the window-function version needs one sort.",
    ].join("\n"),
  },

  {
    slug: "on-call-coverage-gaps-in-march",
    title: "Gaps in the On-Call Rota",
    difficulty: "HARD",
    topics: ["Dates", "Window Functions", "Subqueries"],
    description: [
      "Each team must have someone on call **every day**. A shift covers every date from `start_date` to `end_date`, both inclusive; shifts may overlap and may start before or end after the period. The audit covers **2025-03-01 to 2025-03-14**.",
      "",
      "Report every **gap** — a maximal run of consecutive dates in the audit period on which a team had nobody on call — with the columns `team_name`, `gap_start`, `gap_end` and `gap_days`. A team with no shift at all has one gap covering the whole period; a fully covered team has no row. Order the rows **by `team_name`, then `gap_start`**.",
    ].join("\n"),
    tables: [
      {
        name: "OnCallTeam",
        columns: [
          { name: "team_id", type: "int" },
          { name: "team_name", type: "varchar" },
        ],
        primaryKey: ["team_id"],
        note: "One row per team with an on-call duty. Names are unique.",
      },
      {
        name: "OnCallShift",
        columns: [
          { name: "shift_id", type: "int" },
          { name: "team_id", type: "int" },
          { name: "engineer", type: "varchar" },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
        ],
        primaryKey: ["shift_id"],
        note: "One row per scheduled shift; `end_date` is never before `start_date`.",
      },
    ],
    examples: [
      {
        OnCallTeam: [
          [1, "Payments"],
          [2, "Search"],
          [3, "Platform"],
        ],
        OnCallShift: [
          [1, 1, "Rahul", "2025-02-24", "2025-03-03"],
          [2, 1, "Neha", "2025-03-06", "2025-03-09"],
          [3, 1, "Kabir", "2025-03-08", "2025-03-12"],
          [4, 2, "Ishaan", "2025-03-01", "2025-03-07"],
          [5, 2, "Saanvi", "2025-03-08", "2025-03-20"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 3);
      const teams = sample(rng, TEAMS, n).map((name, i) => [i + 1, name]);
      const shifts: Cell[][] = [];
      let id = 1;
      for (const [tid] of teams) {
        if (chance(rng, 0.15)) continue;
        let day = dateBetween(rng, "2025-02-24", "2025-03-04");
        while (day <= "2025-03-16" && shifts.length < 30) {
          const len = ri(rng, 1, 7);
          shifts.push([id++, tid!, pick(rng, names(rng, 3)), day, addDays(day, len - 1)]);
          // Next shift: right after, overlapping, or after a gap of one to three days.
          day = addDays(day, pick(rng, [len, len, Math.max(1, len - 2), len + ri(rng, 1, 3)]));
        }
      }
      return { OnCallTeam: teams, OnCallShift: shuffle(rng, shifts) };
    },
    solution: [
      "WITH RECURSIVE days AS (",
      "  SELECT CAST('2025-03-01' AS DATE) AS d",
      "  UNION ALL",
      "  SELECT DATE_ADD(d, INTERVAL 1 DAY) FROM days WHERE d < '2025-03-14'",
      "), uncovered AS (",
      "  SELECT t.team_id, t.team_name, days.d",
      "  FROM OnCallTeam t CROSS JOIN days",
      "  WHERE NOT EXISTS (",
      "    SELECT 1 FROM OnCallShift s",
      "    WHERE s.team_id = t.team_id AND s.start_date <= days.d AND s.end_date >= days.d",
      "  )",
      "), numbered AS (",
      "  SELECT team_id, team_name, d, ROW_NUMBER() OVER (PARTITION BY team_id ORDER BY d) AS rn",
      "  FROM uncovered",
      ")",
      "SELECT team_name, MIN(d) AS gap_start, MAX(d) AS gap_end, COUNT(*) AS gap_days",
      "FROM numbered",
      "GROUP BY team_id, team_name, DATE_SUB(d, INTERVAL rn DAY)",
      "ORDER BY team_name, gap_start",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE days AS (",
        "  SELECT CAST('2025-03-01' AS DATE) AS d",
        "  UNION ALL",
        "  SELECT DATE_ADD(d, INTERVAL 1 DAY) FROM days WHERE d < '2025-03-14'",
        "), uncovered AS (",
        "  SELECT t.team_id, t.team_name, days.d",
        "  FROM OnCallTeam t CROSS JOIN days",
        "  LEFT JOIN OnCallShift s ON s.team_id = t.team_id AND days.d BETWEEN s.start_date AND s.end_date",
        "  WHERE s.shift_id IS NULL",
        "), flagged AS (",
        "  SELECT team_id, team_name, d,",
        "         CASE WHEN DATEDIFF(d, LAG(d) OVER (PARTITION BY team_id ORDER BY d)) = 1 THEN 0 ELSE 1 END AS new_gap",
        "  FROM uncovered",
        "), labelled AS (",
        "  SELECT team_id, team_name, d,",
        "         SUM(new_gap) OVER (PARTITION BY team_id ORDER BY d ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS gap_no",
        "  FROM flagged",
        ")",
        "SELECT team_name, MIN(d) AS gap_start, MAX(d) AS gap_end, COUNT(*) AS gap_days",
        "FROM labelled",
        "GROUP BY team_id, team_name, gap_no",
        "ORDER BY team_name, gap_start",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The gaps are made of days that have no row anywhere, so you need the days themselves: generate the 14 dates with a recursive CTE.",
      "Pair every team with every date, and keep the pairs no shift covers (NOT EXISTS, or a LEFT JOIN anti join).",
      "Consecutive uncovered dates form an island: date minus its row number within the team is constant along a run.",
    ],
    editorial: [
      "A gap is a run of days on which **no** shift exists, and absence cannot be selected from the shift table. So the query first creates the calendar: a recursive CTE starts at 2025-03-01 and adds one day until 2025-03-14 — a bounded series of 14 rows. Cross joining it with the teams gives every (team, date) that must be covered, and NOT EXISTS keeps the pairs for which no shift of the team has `start_date <= d <= end_date`. Overlapping shifts and shifts reaching outside the period need no special handling: the test is per day.",
      "",
      "The uncovered days of a team then have to be grouped into runs — **gaps and islands** again. Number them per team in date order; along a run of consecutive dates the date and its row number both rise by one, so `DATE_SUB(d, INTERVAL rn DAY)` is the same for the whole run and changes after any covered day. Grouping by it gives each gap's first day, last day and length. A team without shifts produces all 14 days and one gap; a covered team produces no uncovered days and no row.",
      "",
      "The alternative finds the uncovered days with a LEFT JOIN anti join and labels the runs with LAG: a day starts a new gap unless it is exactly one day after the previous uncovered day, and a running sum of those starts numbers the gaps. Both cost teams × 14 probes into the shifts plus one sort.",
    ].join("\n"),
  },

  {
    slug: "repeat-contact-rate-by-first-ticket-month",
    title: "Repeat Contact Rate by First-Ticket Month",
    difficulty: "HARD",
    topics: ["Dates", "Subqueries", "Aggregation"],
    description: [
      "A customer's **cohort** is the month of their **first ticket** (the earliest `created_at`). A customer is a **repeat contact** when they opened **another ticket within 30 days** of that first ticket — `DATEDIFF(other.created_at, first.created_at)` at most 30. Any other ticket counts, even one created in the same second as the first.",
      "",
      "For each cohort, return the columns `cohort_month` ('YYYY-MM'), `customers`, `repeat_customers` and `repeat_pct` (`100 * repeat_customers / customers`, **rounded to 2 decimals**), **ordered by `cohort_month`**.",
    ].join("\n"),
    tables: [
      {
        name: "CustomerTicket",
        columns: [
          { name: "ticket_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "created_at", type: "datetime" },
          { name: "topic", type: "varchar" },
        ],
        primaryKey: ["ticket_id"],
        note: "One row per support ticket. A customer exists here only once they have opened a ticket.",
      },
    ],
    examples: [
      {
        CustomerTicket: [
          [1, 701, "2025-01-05 10:00:00", "KYC"],
          [2, 701, "2025-02-04 18:00:00", "KYC"],
          [3, 702, "2025-01-20 09:00:00", "Refund"],
          [4, 702, "2025-02-25 11:00:00", "Refund"],
          [5, 703, "2025-01-31 22:00:00", "Login"],
          [6, 704, "2025-02-02 08:00:00", "Delivery"],
          [7, 704, "2025-02-02 08:00:00", "Delivery"],
          [8, 705, "2025-02-14 13:00:00", "Payment"],
          [9, 703, "2025-03-01 12:00:00", "Login"],
        ],
      },
    ],
    gen: (rng) => {
      const TOPICS = ["KYC", "Refund", "Login", "Delivery", "Payment"];
      const customers = sample(rng, seq(701, 30), ri(rng, 1, 9));
      const rows: Cell[][] = [];
      let id = 1;
      for (const c of customers) {
        const first = stamp(rng, "2024-11-15", "2025-02-28");
        rows.push([id++, c, first, pick(rng, TOPICS)]);
        const more = ri(rng, 0, 3);
        for (let j = 0; j < more && rows.length < 30; j++) {
          // Later tickets around the 30-day line, or at the very same moment.
          const days = pick(rng, [0, 30, 31, ri(rng, 1, 29), ri(rng, 32, 90)]);
          const at = days === 0 && chance(rng, 0.5) ? first : addMinutes(first, days * 1440 + ri(rng, -300, 300));
          rows.push([id++, c, at < first ? first : at, pick(rng, TOPICS)]);
        }
      }
      return { CustomerTicket: shuffle(rng, rows) };
    },
    solution: [
      "WITH firsts AS (",
      "  SELECT customer_id, MIN(created_at) AS first_at",
      "  FROM CustomerTicket",
      "  GROUP BY customer_id",
      "), counted AS (",
      "  SELECT f.customer_id, f.first_at, COUNT(*) AS tickets_in_30",
      "  FROM firsts f",
      "  JOIN CustomerTicket t ON t.customer_id = f.customer_id AND DATEDIFF(t.created_at, f.first_at) <= 30",
      "  GROUP BY f.customer_id, f.first_at",
      ")",
      "SELECT DATE_FORMAT(first_at, '%Y-%m') AS cohort_month,",
      "       COUNT(*) AS customers,",
      "       SUM(CASE WHEN tickets_in_30 >= 2 THEN 1 ELSE 0 END) AS repeat_customers,",
      "       ROUND(100 * SUM(CASE WHEN tickets_in_30 >= 2 THEN 1 ELSE 0 END) / COUNT(*), 2) AS repeat_pct",
      "FROM counted",
      "GROUP BY DATE_FORMAT(first_at, '%Y-%m')",
      "ORDER BY cohort_month",
    ].join("\n"),
    alternatives: [
      [
        "WITH firsts AS (",
        "  SELECT ticket_id, customer_id, created_at",
        "  FROM (SELECT ticket_id, customer_id, created_at,",
        "               ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at, ticket_id) AS rn",
        "        FROM CustomerTicket) x",
        "  WHERE rn = 1",
        ")",
        "SELECT DATE_FORMAT(f.created_at, '%Y-%m') AS cohort_month,",
        "       COUNT(*) AS customers,",
        "       SUM(CASE WHEN EXISTS (SELECT 1 FROM CustomerTicket o WHERE o.customer_id = f.customer_id AND o.ticket_id <> f.ticket_id AND DATEDIFF(o.created_at, f.created_at) <= 30) THEN 1 ELSE 0 END) AS repeat_customers,",
        "       ROUND(100 * SUM(CASE WHEN EXISTS (SELECT 1 FROM CustomerTicket o WHERE o.customer_id = f.customer_id AND o.ticket_id <> f.ticket_id AND DATEDIFF(o.created_at, f.created_at) <= 30) THEN 1 ELSE 0 END) / COUNT(*), 2) AS repeat_pct",
        "FROM firsts f",
        "GROUP BY DATE_FORMAT(f.created_at, '%Y-%m')",
        "ORDER BY cohort_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First find each customer's first ticket time — one GROUP BY with MIN.",
      "Then decide per customer whether another ticket falls within 30 days of it; counting the tickets within 30 days (the first included) and asking for at least 2 is one way.",
      "The cohort key is the formatted month of the first ticket, and the rate is a conditional count over the customers of each cohort.",
    ],
    editorial: [
      "Cohort analysis is three steps. **Find the anchor**: each customer's first ticket, `MIN(created_at)` grouped by customer. **Classify the customer**: join their tickets back and count how many fall within 30 days of the anchor (`DATEDIFF(t.created_at, first_at) <= 30`, so a ticket 30 calendar days later still counts and one 31 days later does not). The first ticket itself is always in that count, so a customer is a repeat contact exactly when the count is at least 2 — which also gets the same-second duplicate right without comparing ids. **Aggregate per cohort**: group the customers by `DATE_FORMAT(first_at, '%Y-%m')`, count them, count the repeaters with a conditional SUM, and divide, rounding to 2 decimals.",
      "",
      "The cohort is the month of the *first* ticket only; a customer's later tickets in other months never create a cohort row of their own, which is why the grouping happens after the per-customer step and not on the raw tickets.",
      "",
      "The alternative picks the first ticket as a row with `ROW_NUMBER` (ordered by time and then id, so ties pick one) and asks with a correlated EXISTS whether any **other** ticket id lies within 30 days. It states the definition literally; the counting version needs no correlated subquery. Both scale with tickets per customer.",
    ].join("\n"),
  },

  {
    slug: "api-client-sessions-with-server-errors",
    title: "Sessionise API Calls and Count Server Errors",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Conditional Logic"],
    description: [
      "A merchant's integration talks to the payments API in bursts. The API team groups each client's calls into **sessions**: calls are taken in order of `called_at` (then `call_id`), and a call starts a **new session** when it comes **more than 30 minutes** (1800 seconds) after the client's previous call; exactly 30 minutes still continues the session. A client's first call starts session 1.",
      "",
      "Return one row per session with the columns `client_id`, `session_no` (1, 2, … per client, in time order), `session_start`, `session_end` (first and last call times), `calls` and `server_errors` (calls with `status_code` 500 or above), **ordered by `client_id`, then `session_no`**.",
    ].join("\n"),
    tables: [
      {
        name: "ApiCall",
        columns: [
          { name: "call_id", type: "int" },
          { name: "client_id", type: "varchar" },
          { name: "called_at", type: "datetime" },
          { name: "status_code", type: "int" },
        ],
        primaryKey: ["call_id"],
        note: "One row per API call. Client ids are lower case, e.g. 'merchant-104'.",
      },
    ],
    examples: [
      {
        ApiCall: [
          [1, "merchant-104", "2025-08-12 09:00:00", 200],
          [2, "merchant-104", "2025-08-12 09:20:00", 502],
          [3, "merchant-104", "2025-08-12 09:50:00", 200],
          [4, "merchant-104", "2025-08-12 10:20:01", 200],
          [5, "merchant-104", "2025-08-12 10:25:00", 503],
          [6, "merchant-221", "2025-08-12 09:10:00", 401],
          [7, "merchant-221", "2025-08-12 09:10:00", 200],
          [8, "merchant-221", "2025-08-12 13:00:00", 500],
        ],
      },
    ],
    gen: (rng) => {
      const clients = sample(rng, ["merchant-104", "merchant-221", "merchant-317", "merchant-450"], ri(rng, 1, 3));
      const rows: Cell[][] = [];
      let id = 1;
      for (const c of clients) {
        let at = `2025-08-12 0${ri(rng, 8, 9)}:${pad2(ri(rng, 0, 59))}:00`;
        const k = ri(rng, 0, 9);
        for (let j = 0; j < k; j++) {
          rows.push([id++, c, at, pick(rng, [200, 200, 200, 201, 401, 429, 500, 502, 503])]);
          at = addSeconds(at, pick(rng, [0, 1800, 1801, ri(rng, 1, 1799), ri(rng, 1802, 7200)]));
        }
      }
      return { ApiCall: shuffle(rng, rows) };
    },
    solution: [
      "WITH gaps AS (",
      "  SELECT call_id, client_id, called_at, status_code,",
      "         LAG(called_at) OVER (PARTITION BY client_id ORDER BY called_at, call_id) AS prev_at",
      "  FROM ApiCall",
      "), numbered AS (",
      "  SELECT client_id, called_at, status_code,",
      "         SUM(CASE WHEN prev_at IS NULL OR TIMESTAMPDIFF(SECOND, prev_at, called_at) > 1800 THEN 1 ELSE 0 END)",
      "           OVER (PARTITION BY client_id ORDER BY called_at, call_id",
      "                 ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS session_no",
      "  FROM gaps",
      ")",
      "SELECT client_id, session_no,",
      "       MIN(called_at) AS session_start, MAX(called_at) AS session_end,",
      "       COUNT(*) AS calls,",
      "       SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) AS server_errors",
      "FROM numbered",
      "GROUP BY client_id, session_no",
      "ORDER BY client_id, session_no",
    ].join("\n"),
    alternatives: [
      [
        "WITH starts AS (",
        "  SELECT s.call_id, s.client_id, s.called_at FROM ApiCall s",
        "  WHERE NOT EXISTS (",
        "    SELECT 1 FROM ApiCall p",
        "    WHERE p.client_id = s.client_id",
        "      AND (p.called_at < s.called_at OR (p.called_at = s.called_at AND p.call_id < s.call_id))",
        "      AND TIMESTAMPDIFF(SECOND, p.called_at, s.called_at) <= 1800",
        "  )",
        "), labelled AS (",
        "  SELECT c.client_id, c.called_at, c.status_code,",
        "         (SELECT COUNT(*) FROM starts st",
        "          WHERE st.client_id = c.client_id",
        "            AND (st.called_at < c.called_at OR (st.called_at = c.called_at AND st.call_id <= c.call_id))) AS session_no",
        "  FROM ApiCall c",
        ")",
        "SELECT client_id, session_no, MIN(called_at) AS session_start, MAX(called_at) AS session_end,",
        "       COUNT(*) AS calls, SUM(IF(status_code >= 500, 1, 0)) AS server_errors",
        "FROM labelled",
        "GROUP BY client_id, session_no",
        "ORDER BY client_id, session_no",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Compare every call with the same client's previous call — LAG, ordered by time and then id.",
      "Flag a call as a session start when there is no previous call or the gap is over 1800 seconds; measure the gap in seconds so 30:01 is not mistaken for 30 minutes.",
      "A running SUM of the start flags is the session number of every call.",
      "Then it is an ordinary GROUP BY per (client, session).",
    ],
    editorial: [
      "**Sessionisation** turns a stream of events into groups separated by idle gaps, and it is two window passes. First `LAG(called_at) OVER (PARTITION BY client_id ORDER BY called_at, call_id)` puts each call next to the client's previous one (the `call_id` tie-break fixes the order of calls in the same second). A call starts a session when there is no previous call or `TIMESTAMPDIFF(SECOND, prev_at, called_at) > 1800`. Measuring in seconds matters: `TIMESTAMPDIFF(MINUTE, …)` truncates, so a gap of 30 minutes and 1 second would read as 30 and wrongly continue the session.",
      "",
      "Second, a running SUM of the 0/1 start flags, with an explicit `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` frame, numbers the sessions 1, 2, … per client — the first call always contributes a 1, so numbering starts at 1. After that the answer is a GROUP BY on (client, session): first and last call times, the call count and a conditional count of 5xx responses. Two calls in the same second are 0 seconds apart and always share a session.",
      "",
      "The alternative avoids LAG: a call starts a session when no earlier call of the client lies within 1800 seconds before it (if any earlier call is that close, the immediately previous one is too), and a call's session number is the count of session starts up to and including it. It is quadratic per client; the window version is a single sort.",
    ].join("\n"),
  },

  {
    slug: "median-time-to-resolve-by-severity",
    title: "Median Time to Resolve Incidents by Severity",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Aggregation"],
    description: [
      "Averages hide the shape of MTTR — one 3-day incident drags the mean far from a typical one — so the reliability review reports the **median** time to resolve. An incident's time to resolve is `TIMESTAMPDIFF(MINUTE, opened_at, resolved_at)`; unresolved incidents (`resolved_at` NULL) are left out. With an even number of incidents the median is the **average of the two middle values**.",
      "",
      "For each severity with at least one resolved incident, return the columns `severity`, `resolved_incidents` and `median_minutes` (**rounded to 1 decimal**), **ordered by `severity`**.",
    ].join("\n"),
    tables: [
      {
        name: "SevIncident",
        columns: [
          { name: "incident_id", type: "int" },
          { name: "severity", type: "enum", values: ["SEV1", "SEV2", "SEV3"] },
          { name: "opened_at", type: "datetime" },
          { name: "resolved_at", type: "datetime" },
        ],
        primaryKey: ["incident_id"],
        note: "One row per incident. Times are whole minutes; `resolved_at` is NULL while the incident is open.",
      },
    ],
    examples: [
      {
        SevIncident: [
          [1, "SEV1", "2025-05-02 10:00:00", "2025-05-02 10:40:00"],
          [2, "SEV1", "2025-05-09 22:00:00", "2025-05-10 01:00:00"],
          [3, "SEV1", "2025-05-15 03:00:00", "2025-05-15 03:25:00"],
          [4, "SEV2", "2025-05-03 12:00:00", "2025-05-03 13:30:00"],
          [5, "SEV2", "2025-05-06 09:00:00", "2025-05-06 10:15:00"],
          [6, "SEV2", "2025-05-08 14:00:00", "2025-05-11 14:00:00"],
          [7, "SEV2", "2025-05-20 16:00:00", "2025-05-20 17:00:00"],
          [8, "SEV3", "2025-05-21 11:00:00", null],
        ],
      },
    ],
    gen: (rng) => {
      const m = chance(rng, 0.04) ? 0 : ri(rng, 1, 22);
      const coarse = chance(rng, 0.5);
      const rows = seq(1, m).map((id) => {
        const opened = stamp(rng, "2025-05-01", "2025-05-31");
        const mins = coarse ? ri(rng, 1, 8) * 15 : ri(rng, 5, 4000);
        return [id, pick(rng, ["SEV1", "SEV2", "SEV3"]), opened, chance(rng, 0.12) ? null : addMinutes(opened, mins)];
      });
      return { SevIncident: rows };
    },
    solution: [
      "WITH resolved AS (",
      "  SELECT severity, TIMESTAMPDIFF(MINUTE, opened_at, resolved_at) AS mins",
      "  FROM SevIncident",
      "  WHERE resolved_at IS NOT NULL",
      "), ranked AS (",
      "  SELECT severity, mins,",
      "         ROW_NUMBER() OVER (PARTITION BY severity ORDER BY mins) AS pos,",
      "         COUNT(*) OVER (PARTITION BY severity) AS n",
      "  FROM resolved",
      ")",
      "SELECT severity, MIN(n) AS resolved_incidents, ROUND(AVG(mins), 1) AS median_minutes",
      "FROM ranked",
      "WHERE pos IN ((n + 1) DIV 2, (n + 2) DIV 2)",
      "GROUP BY severity",
      "ORDER BY severity",
    ].join("\n"),
    alternatives: [
      [
        "WITH resolved AS (",
        "  SELECT incident_id, severity, TIMESTAMPDIFF(MINUTE, opened_at, resolved_at) AS mins",
        "  FROM SevIncident WHERE resolved_at IS NOT NULL",
        "), cnt AS (",
        "  SELECT severity, COUNT(*) AS n FROM resolved GROUP BY severity",
        ")",
        "SELECT c.severity, c.n AS resolved_incidents, ROUND(AVG(DISTINCT a.mins), 1) AS median_minutes",
        "FROM cnt c",
        "JOIN resolved a ON a.severity = c.severity",
        "WHERE 2 * (SELECT COUNT(*) FROM resolved b WHERE b.severity = a.severity AND b.mins <= a.mins) >= c.n",
        "  AND 2 * (SELECT COUNT(*) FROM resolved b WHERE b.severity = a.severity AND b.mins >= a.mins) >= c.n",
        "GROUP BY c.severity, c.n",
        "ORDER BY c.severity",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Compute each resolved incident's minutes first; then the problem is a median per group.",
      "Number each severity's values in ascending order and attach the group's count with a window.",
      "The middle positions are `(n + 1) DIV 2` and `(n + 2) DIV 2` — the same position when n is odd, the two middle ones when n is even. Average the values found there.",
    ],
    editorial: [
      "MySQL has no MEDIAN aggregate, so it is built from window functions. Compute the minutes per resolved incident, then in one pass give each value its position within the severity (`ROW_NUMBER() … ORDER BY mins`) and the severity's size (`COUNT(*) OVER (PARTITION BY severity)`). The median sits at positions `(n + 1) DIV 2` and `(n + 2) DIV 2`: for n = 5 both are 3, for n = 4 they are 2 and 3. Keeping the rows at those positions and taking their AVG gives the middle value for odd n and the mean of the two middle values for even n — one formula for both cases. The result is a whole number or ends in .5, so rounding to 1 decimal is exact.",
      "",
      "Equal durations do not matter: ROW_NUMBER orders tied values arbitrarily, but they are equal, so the values at the middle positions are the same whichever way the tie was broken. Unresolved incidents are filtered out before numbering and change neither the positions nor n.",
      "",
      "The alternative is the counting definition: a value is a middle value when at least half the values are ≤ it and at least half are ≥ it. With duplicates several rows can qualify, so it averages the **distinct** qualifying values — exactly the one median value, or the two middle ones. It is quadratic per severity; the window version is a sort.",
    ].join("\n"),
  },
];
