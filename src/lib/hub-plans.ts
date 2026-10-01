/**
 * The study plans on the hub pages: a topic's (/challenges/<topic>) and a
 * company's (/challenges/company/<company>). Pure rules over lists the hub
 * service has already ranked (services/problem-hubs), pinned by
 * hub-plans.test.ts.
 *
 * A hub lists every problem, which is a directory, not a plan: Arrays has
 * 667 and Amazon 914, and a reader who arrives from "sliding window
 * practice" or "amazon coding questions" wants to know which dozen to do
 * first and in what order. So each hub also answers with a short path:
 *
 * - A topic's plan is a difficulty ladder over its best-known problems — a
 *   few easy ones that use the pattern plainly, the mediums that add a
 *   twist, a few hard ones — cut into days of about an hour, the first day
 *   opening with the essentials sheet and the walkthrough.
 * - A company's plan groups its problems by technique, taken in the order
 *   the techniques build on each other (TOPIC_ORDER), each topic getting a
 *   share of the plan in proportion to how often it comes up in that
 *   company's list, easiest first within it; then weeks of about ten
 *   problems, and the company's placement pattern to finish, where it has
 *   one.
 *
 * The minutes are an estimate a reader can plan around, said as one
 * ("about"), not a measurement: 20 for an easy problem, 35 for a medium, 50
 * for a hard one, 15 to read the sheet.
 */

export interface PlanProblem {
  slug: string;
  title: string;
  difficulty: string;
  /** The problem's topic tags only — companies are not topics. */
  topics: string[];
}

export interface PlanStage {
  /** "Day 1", "Week 2: Stack, Queue". */
  title: string;
  /** What the stage is for, one sentence. */
  note: string;
  /** About how long the stage takes, by MINUTES. */
  minutes: number;
  problems: PlanProblem[];
  /** Where the stage sends the reader instead of (or after) its problems — a company's mock test. */
  link?: { href: string; label: string };
  /** For a company's week: the topics it covers, as hub links. */
  topics?: Array<{ slug: string; label: string }>;
}

export interface StudyPlan {
  /** The plan in one or two sentences. */
  summary: string;
  stages: PlanStage[];
  /** Problems in the plan. */
  picked: number;
  /** The hub's problems the plan leaves for afterwards. */
  rest: number;
  /** About how long the whole plan takes. */
  minutes: number;
}

export const MINUTES: Readonly<Record<string, number>> = { EASY: 20, MEDIUM: 35, HARD: 50 };
const READ_MINUTES = 15;
/** A day of a topic plan: about an hour, so most days are three easy problems or two mediums. */
const DAY_BUDGET = 75;
/** How many of each level a topic plan takes, at most. */
const TOPIC_PICK = { EASY: 4, MEDIUM: 7, HARD: 3 } as const;
/** A company plan's length, at most, and its weeks' size. */
const COMPANY_PICK = 40;
const WEEK_SIZE = 10;

const level = (p: PlanProblem) => (p.difficulty.toUpperCase() in MINUTES ? p.difficulty.toUpperCase() : "MEDIUM");
const minutesOf = (p: PlanProblem) => MINUTES[level(p)] ?? 35;
const LEVEL_ORDER = ["EASY", "MEDIUM", "HARD"] as const;
const LEVEL_RANK: Record<string, number> = { EASY: 0, MEDIUM: 1, HARD: 2 };

/** "1 h 20 min", "45 min", "6 h". */
export function duration(minutes: number): string {
  const m = Math.round(minutes / 5) * 5;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  return r ? `${h} h ${r} min` : `${h} h`;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const and = (xs: readonly string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : (xs[0] ?? ""));

/**
 * A topic's plan. `problems` is the hub's whole list in priority order (the
 * service puts the roadmap's and the essentials sheet's picks first); the
 * plan takes the first few of each level from it and climbs easy → hard.
 */
export function topicPlan(input: { label: string; problems: readonly PlanProblem[]; next?: { label: string; href: string } | null }): StudyPlan {
  const { label, problems } = input;
  const picked = LEVEL_ORDER.flatMap((lv) => problems.filter((p) => level(p) === lv).slice(0, TOPIC_PICK[lv]));
  const stages: PlanStage[] = [];
  let day: PlanStage | null = null;
  const open = (): PlanStage => {
    const s: PlanStage = { title: `Day ${stages.length + 1}`, note: "", minutes: stages.length === 0 ? READ_MINUTES : 0, problems: [] };
    stages.push(s);
    return s;
  };
  for (const p of picked) {
    const m = minutesOf(p);
    // A new day when this one is full. Not on a change of level: that left a
    // day holding the last easy problem alone (20 minutes) before the mediums.
    if (!day || (day.problems.length > 0 && day.minutes + m > DAY_BUDGET)) day = open();
    day.problems.push(p);
    day.minutes += m;
  }
  if (stages.length === 0) open();
  // Each level's first day says what the level is for; the days after it
  // say what to do differently, so four medium days do not repeat one line.
  const NOTES: Record<number, [string, string]> = {
    0: ["Easy problems that use the pattern in its plainest form — aim to write each one without looking anything up.", "Finish the easy set against the clock: about fifteen minutes each, and redo any that took longer."],
    1: ["Medium problems: the same pattern with one twist each. Name the twist before you code.", "More mediums. Before coding each one, write down what state the pattern keeps and when it changes."],
    2: ["Hard problems: the pattern combined with a second idea. Give each a full attempt before reading the editorial.", "Another hard one. If it beats you after a real attempt, read the editorial, then solve it again tomorrow from memory."],
  };
  const seen = new Set<number>();
  stages.forEach((s, i) => {
    const top = s.problems.reduce((hi, p) => Math.max(hi, LEVEL_RANK[level(p)] ?? 1), 0);
    if (i === 0) {
      seen.add(top);
      s.note = `Learn the pattern: read the essentials and step through the walkthrough above, then solve ${s.problems.length === 1 ? "this problem" : `these ${s.problems.length}`}.`;
      return;
    }
    s.note = NOTES[top][seen.has(top) ? 1 : 0];
    seen.add(top);
  });
  const minutes = stages.reduce((t, s) => t + s.minutes, 0);
  const rest = problems.length - picked.length;
  const levels = LEVEL_ORDER.map((lv) => [lv, picked.filter((p) => level(p) === lv).length] as const)
    .filter(([, n]) => n > 0)
    .map(([lv, n]) => `${n} ${lv.toLowerCase()}`);
  const summary =
    `${picked.length === problems.length ? (problems.length === 1 ? `The one ${label} problem` : `All ${problems.length} ${label} problems`) : `${picked.length} of the ${problems.length} ${label} problems`} (${and(levels)}) over ${plural(stages.length, "day")}, about ${duration(minutes)} in all — the pattern first, then easiest to hardest.` +
    (rest > 0 ? ` After that, the other ${rest} in the full list below are practice at your own pace.` : "") +
    (input.next ? ` Then move on to ${input.next.label}.` : "");
  if (input.next) stages[stages.length - 1].link = { href: input.next.href, label: `Next topic: ${input.next.label}` };
  return { summary, stages, picked: picked.length, rest, minutes };
}

export interface CompanyPlanProblem extends PlanProblem {
  /** The topic this problem practises most specifically (its rarest topic tag that has a page), or null. */
  primary: { slug: string; label: string; rank: number } | null;
}

/**
 * A company's plan. `problems` is the company's list in priority order,
 * each with its primary topic; the plan shares COMPANY_PICK places among
 * the topics by how often each comes up, keeps the topics in learning order
 * and the problems easiest first within a topic, then cuts weeks.
 */
export function companyPlan(input: { label: string; problems: readonly CompanyPlanProblem[]; patterns?: ReadonlyArray<{ slug: string; name: string }> }): StudyPlan {
  const { label, problems } = input;
  const budget = Math.min(problems.length, COMPANY_PICK);
  // Topics by how many of the company's problems they hold, most first.
  const buckets = new Map<string, { slug: string; label: string; rank: number; rows: CompanyPlanProblem[] }>();
  for (const p of problems) {
    const key = p.primary?.slug ?? "";
    let b = buckets.get(key);
    if (!b) buckets.set(key, (b = { slug: key, label: p.primary?.label ?? "Mixed", rank: p.primary?.rank ?? Number.MAX_SAFE_INTEGER, rows: [] }));
    b.rows.push(p);
  }
  const bySize = [...buckets.values()].sort((a, b) => b.rows.length - a.rows.length || a.rank - b.rank);
  // Shares in proportion to size, at least one each while places remain,
  // largest topics first so a long tail of one-problem topics cannot crowd
  // out the topics the company actually asks.
  const quota = new Map<string, number>();
  let left = budget;
  for (const b of bySize) {
    if (left <= 0) break;
    const share = Math.max(1, Math.round((budget * b.rows.length) / problems.length));
    const take = Math.min(share, b.rows.length, left);
    quota.set(b.slug, take);
    left -= take;
  }
  // Places a rounding left unused go to the biggest topics that have problems to spare.
  for (const b of bySize) {
    if (left <= 0) break;
    const has = quota.get(b.slug) ?? 0;
    const more = Math.min(b.rows.length - has, left);
    if (more > 0 && has > 0) {
      quota.set(b.slug, has + more);
      left -= more;
    }
  }
  const chosen = [...buckets.values()]
    .filter((b) => (quota.get(b.slug) ?? 0) > 0)
    .sort((a, b) => a.rank - b.rank)
    .map((b) => ({
      ...b,
      // The best-known problems by priority (not the easiest: a topic's
      // share of three would be three warm-ups), then climbed easy → hard;
      // the sort is stable, so priority holds inside a level.
      picks: b.rows.slice(0, quota.get(b.slug)).sort((x, y) => (LEVEL_RANK[level(x)] ?? 1) - (LEVEL_RANK[level(y)] ?? 1)),
    }));

  // Weeks: whole topics, about WEEK_SIZE problems each; a topic bigger
  // than a week runs on into the next one rather than splitting a day.
  const stages: PlanStage[] = [];
  let week: PlanStage | null = null;
  const weekly = budget > WEEK_SIZE + 2;
  for (const t of chosen) {
    if (!week || (weekly && week.problems.length > 0 && week.problems.length + t.picks.length > WEEK_SIZE + 2)) {
      week = { title: "", note: "", minutes: 0, problems: [], topics: [] };
      stages.push(week);
    }
    week.problems.push(...t.picks);
    week.minutes += t.picks.reduce((m, p) => m + minutesOf(p), 0);
    if (t.slug) week.topics!.push({ slug: t.slug, label: t.label });
  }
  stages.forEach((s, i) => {
    const names = s.topics!.map((t) => t.label);
    s.title = weekly ? `Week ${i + 1}: ${names.length > 3 ? `${names.slice(0, 3).join(", ")} +${names.length - 3}` : names.join(", ") || "Mixed"}` : "The plan";
    const order = s.problems.length < 2 ? "" : names.length > 1 ? ", easiest first within each topic" : ", easiest first";
    s.note = `${plural(s.problems.length, "problem")} on ${names.length ? and(names) : "mixed topics"}${order}.`;
    if (s.topics!.length === 0) delete s.topics;
  });
  const pattern = input.patterns?.[0];
  if (pattern) {
    stages.push({
      title: weekly ? "Finally: the timed test" : "Then: the timed test",
      note: `Sit the ${pattern.name} mock under the clock — the coding problems are only one part of the round.`,
      minutes: 0,
      problems: [],
      link: { href: `/tests/${pattern.slug}`, label: `Take the ${pattern.name} mock` },
    });
  }
  const picked = chosen.reduce((n, t) => n + t.picks.length, 0);
  const minutes = stages.reduce((t, s) => t + s.minutes, 0);
  const topics = chosen.filter((t) => t.slug).map((t) => t.label);
  const span = weekly ? ` over ${plural(stages.filter((s) => s.problems.length).length, "week")}` : "";
  const named = topics.length ? ` — ${and(topics.slice(0, 4))}${topics.length > 4 ? ` and ${topics.length - 4} more` : ""}` : "";
  const summary =
    `${picked === problems.length ? (problems.length === 1 ? "The one problem" : `All ${problems.length} problems`) : `${picked} of the ${problems.length} problems`} tagged ${label}${span}, about ${duration(minutes)} of solving` +
    // An order is only worth saying when there is more than one topic to put in it.
    (topics.length > 1 ? `, grouped by technique in the order they build on each other${named}.` : topics.length === 1 ? `, all on ${topics[0]}.` : ".") +
    (pattern ? ` It ends with the ${pattern.name} mock.` : "");
  return { summary, stages, picked, rest: problems.length - picked, minutes };
}
