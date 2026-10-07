import { prisma } from "../lib/prisma.js";
import { cached, invalidate } from "../lib/cache.js";
import { SQL_PROBLEMS } from "../lib/sql-problems/index.js";
import { skillTopic } from "../lib/skill-catalog.js";
import {
  SKILLS,
  skillsForAptitudeCategory,
  skillsForBugHunt,
  skillsForProblemTags,
  skillsForSkillTest,
  skillsForSqlTopics,
} from "../lib/skill-graph.js";
import { SOURCE_RULES, outcomeOf, toDifficulty, type AssessmentRecord, type Attempt, type ItemHistory, type SkillCatalogue } from "../lib/skill-score.js";
import { buildSkillProfile, type ProblemCandidate, type SkillProfile } from "../lib/skill-profile.js";
// The usual inert cycle: dashboard imports invalidateSkillProfile from here.
import { getCatalogue } from "./dashboard.js";
import { bugPath } from "./bug-hunts.js";

/**
 * The skill profile's facts: one account's evidence from the tables that
 * already hold it, shaped into the records lib/skill-profile.ts scores.
 *
 *   coding problems   Submission (+ ProblemEngagement: opened / hints / editorial)
 *   bug hunts         BugSubmission
 *   SQL problems      SqlSubmission
 *   aptitude          AptitudeAttempt
 *   CS fundamentals   SkillAttempt (closed sittings, with their topic marks)
 *
 * Nothing is written here. Seven reads, all on (userId, …) indexes and
 * none selecting code or queries, then the scoring in memory — a few
 * milliseconds for an account with thousands of submissions. Held for a
 * minute per account and dropped by invalidateDashboard, which every judge
 * already calls after a verdict; the aptitude route drops the dashboard
 * only once per account per process, so an aptitude answer can take up to
 * the minute to show.
 *
 * The catalogue side (which skills each problem, hunt and question
 * evidences, and how much there is of each) is the same for everyone and is
 * built once per two minutes.
 */

/** The newest rows read per source — far beyond any real account, a ceiling on a pathological one. */
const MAX_ROWS = 20_000;

// ── The catalogue side ────────────────────────────────────────────

export interface Catalogues {
  catalogue: Map<string, SkillCatalogue>;
  problems: ProblemCandidate[];
  problemById: Map<string, ProblemCandidate>;
  bugById: Map<string, { title: string; href: string; difficulty: ReturnType<typeof toDifficulty>; skills: string[] }>;
  aptitudeById: Map<string, { title: string; href: string; difficulty: ReturnType<typeof toDifficulty>; skills: string[]; parSecs: number }>;
  sqlBySlug: Map<string, { title: string; href: string; difficulty: ReturnType<typeof toDifficulty>; skills: string[] }>;
  testById: Map<string, { skills: string[]; level: AssessmentRecord["level"]; title: string; href: string; skill: string }>;
}

export function skillCatalogues(): Promise<Catalogues> {
  return cached("skill:catalogues:v1", 120_000, async () => {
    const [problems, bugs, questions, tests] = await Promise.all([
      getCatalogue(),
      prisma.bugChallenge.findMany({ where: { isPublished: true }, select: { id: true, slug: true, title: true, difficulty: true, category: true, tags: true } }),
      prisma.aptitudeQuestion.findMany({ select: { id: true, slug: true, title: true, category: true, difficulty: true, timeTargetSec: true } }),
      prisma.skillTest.findMany({ select: { id: true, slug: true, title: true, skill: true, level: true, published: true } }),
    ]);

    const catalogue = new Map<string, SkillCatalogue>();
    const count = (keys: readonly string[], source: SkillCatalogue["source"], points: number) => {
      for (const key of keys) {
        const c = catalogue.get(key) ?? { source, count: 0, points: 0 };
        c.count++;
        c.points += points;
        catalogue.set(key, c);
      }
    };

    const candidates: ProblemCandidate[] = [];
    for (const p of problems) {
      const tags = Array.isArray(p.tags) ? (p.tags as string[]) : [];
      const difficulty = toDifficulty(p.difficulty);
      const skills = skillsForProblemTags(tags);
      count(skills, "problem", SOURCE_RULES.problem.weight[difficulty]);
      candidates.push({ id: p.id, slug: p.slug, title: p.title, difficulty, number: p.number ?? null, skills });
    }

    const bugById: Catalogues["bugById"] = new Map();
    for (const b of bugs) {
      const difficulty = toDifficulty(b.difficulty);
      const skills = skillsForBugHunt(b.category, Array.isArray(b.tags) ? (b.tags as string[]) : []);
      count(skills, "bug", SOURCE_RULES.bug.weight[difficulty]);
      bugById.set(b.id, { title: b.title, href: bugPath(b), difficulty, skills });
    }

    const sqlBySlug: Catalogues["sqlBySlug"] = new Map();
    for (const q of SQL_PROBLEMS) {
      const difficulty = toDifficulty(q.difficulty);
      const skills = skillsForSqlTopics(q.topics);
      count(skills, "sql", SOURCE_RULES.sql.weight[difficulty]);
      sqlBySlug.set(q.slug, { title: q.title, href: `/sql/${q.slug}`, difficulty, skills });
    }

    const aptitudeById: Catalogues["aptitudeById"] = new Map();
    for (const q of questions) {
      const difficulty = toDifficulty(q.difficulty);
      const skills = skillsForAptitudeCategory(q.category);
      count(skills, "aptitude", SOURCE_RULES.aptitude.weight[difficulty]);
      aptitudeById.set(q.id, { title: q.title, href: `/aptitude/q/${q.slug}`, difficulty, skills, parSecs: q.timeTargetSec });
    }

    const testById: Catalogues["testById"] = new Map();
    for (const t of tests) {
      const skills = skillsForSkillTest(t.skill);
      const level = t.level === "advanced" ? "advanced" : t.level === "intermediate" ? "intermediate" : "basic";
      // Unpublished tests still describe a sitting someone made; only a
      // published one makes the skill measurable.
      if (t.published) count(skills, "assessment", 0);
      testById.set(t.id, { skills, level, title: t.title, href: `/skill-tests/${t.slug}`, skill: t.skill });
    }

    return { catalogue, problems: candidates, problemById: new Map(candidates.map((c) => [c.id, c])), bugById, aptitudeById, sqlBySlug, testById };
  });
}

// ── One account's evidence ────────────────────────────────────────

const ratio = (passed: number, total: number) => (total > 0 ? passed / total : null);

/** Rows arrive newest first (so the cap keeps the recent ones); group them per item, oldest first. */
function group<R, K>(rows: readonly R[], keyOf: (r: R) => K): Map<K, R[]> {
  const out = new Map<K, R[]>();
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    const k = keyOf(r);
    const list = out.get(k);
    if (list) list.push(r);
    else out.set(k, [r]);
  }
  return out;
}

async function loadEvidence(userId: string, cat: Catalogues): Promise<{ items: ItemHistory[]; assessments: AssessmentRecord[]; analyses: Array<{ problemId: string; category: string; at: number }> }> {
  const newest = { take: MAX_ROWS } as const;
  const [submissions, engagements, bugSubs, sqlSubs, aptitude, sittings, reviews] = await Promise.all([
    prisma.submission.findMany({
      where: { userId },
      orderBy: { submittedAt: "desc" },
      ...newest,
      select: { problemId: true, verdict: true, submittedAt: true, roomId: true, passedCases: true, totalCases: true },
    }),
    prisma.problemEngagement.findMany({ where: { userId }, select: { problemId: true, openedAt: true, hintsAt: true, editorialAt: true } }),
    prisma.bugSubmission.findMany({
      where: { userId },
      orderBy: { submittedAt: "desc" },
      ...newest,
      select: { challengeId: true, verdict: true, submittedAt: true, passedTests: true, totalTests: true, timeTakenSecs: true },
    }),
    prisma.sqlSubmission.findMany({
      where: { userId },
      orderBy: { submittedAt: "desc" },
      ...newest,
      select: { slug: true, verdict: true, submittedAt: true, passedCases: true, totalCases: true },
    }),
    prisma.aptitudeAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      ...newest,
      select: { questionId: true, selected: true, correct: true, timeSec: true, usedHints: true, createdAt: true },
    }),
    prisma.skillAttempt.findMany({
      where: { userId, status: { in: ["submitted", "expired", "terminated"] }, percent: { not: null } },
      orderBy: { startedAt: "desc" },
      take: 200,
      select: { testId: true, status: true, submittedAt: true, expiresAt: true, percent: true, topicScores: true },
    }),
    // What the "Why it failed" reviews found this month (services/submission-analysis.ts).
    prisma.submissionAnalysis.findMany({
      where: { userId, category: { not: null }, createdAt: { gte: new Date(Date.now() - 31 * 86_400_000) } },
      select: { problemId: true, category: true, createdAt: true },
      take: 2_000,
    }),
  ]);

  const items: ItemHistory[] = [];
  const engagementOf = new Map(engagements.map((e) => [e.problemId, e]));

  for (const [problemId, rows] of group(submissions, (r) => r.problemId)) {
    const p = cat.problemById.get(problemId);
    if (!p || !p.skills.length) continue;
    const e = engagementOf.get(problemId);
    items.push({
      source: "problem",
      id: problemId,
      title: p.title,
      href: `/problems/${p.slug}`,
      difficulty: p.difficulty,
      skills: p.skills,
      attempts: rows.map(
        (r): Attempt => ({ at: r.submittedAt.getTime(), outcome: outcomeOf(r.verdict), passRatio: ratio(r.passedCases, r.totalCases), paired: r.roomId != null }),
      ),
      openedAt: e?.openedAt.getTime() ?? null,
      hintsAt: e?.hintsAt?.getTime() ?? null,
      solutionAt: e?.editorialAt?.getTime() ?? null,
    });
  }

  for (const [challengeId, rows] of group(bugSubs, (r) => r.challengeId)) {
    const b = cat.bugById.get(challengeId);
    if (!b || !b.skills.length) continue;
    items.push({
      source: "bug",
      id: challengeId,
      title: b.title,
      href: b.href,
      difficulty: b.difficulty,
      skills: b.skills,
      attempts: rows.map((r): Attempt => ({ at: r.submittedAt.getTime(), outcome: outcomeOf(r.verdict), passRatio: ratio(r.passedTests, r.totalTests), secs: r.timeTakenSecs })),
    });
  }

  for (const [slug, rows] of group(sqlSubs, (r) => r.slug)) {
    const q = cat.sqlBySlug.get(slug);
    if (!q || !q.skills.length) continue;
    items.push({
      source: "sql",
      id: slug,
      title: q.title,
      href: q.href,
      difficulty: q.difficulty,
      skills: q.skills,
      attempts: rows.map((r): Attempt => ({ at: r.submittedAt.getTime(), outcome: outcomeOf(r.verdict), passRatio: ratio(r.passedCases, r.totalCases) })),
    });
  }

  for (const [questionId, rows] of group(aptitude, (r) => r.questionId)) {
    const q = cat.aptitudeById.get(questionId);
    if (!q || !q.skills.length) continue;
    items.push({
      source: "aptitude",
      id: questionId,
      title: q.title,
      href: q.href,
      difficulty: q.difficulty,
      skills: q.skills,
      parSecs: q.parSecs,
      // Every answer is returned with the key and the worked solution, so
      // any answer after the first has seen them: a later "correct" is
      // recall of the solution, and is credited as such.
      attempts: rows.map(
        (r, i): Attempt => ({
          at: r.createdAt.getTime(),
          outcome: r.correct ? "accepted" : r.selected === null ? "other" : "wrong",
          secs: r.timeSec,
          hinted: r.usedHints > 0,
          revealed: i > 0 || r.selected === null,
        }),
      ),
    });
  }

  const assessments: AssessmentRecord[] = [];
  for (const s of sittings) {
    const test = cat.testById.get(s.testId);
    if (!test || !test.skills.length || s.percent == null) continue;
    const topics = Array.isArray(s.topicScores) ? (s.topicScores as Array<{ topic: string; total: number; correct: number }>) : [];
    assessments.push({
      id: s.testId,
      title: test.title,
      href: test.href,
      skills: test.skills,
      at: (s.submittedAt ?? s.expiresAt).getTime(),
      percent: s.percent,
      level: test.level,
      terminated: s.status === "terminated",
      topics: topics.map((t) => ({ label: skillTopic(test.skill, t.topic)?.label ?? t.topic, total: t.total, correct: t.correct })),
    });
  }

  const analyses = reviews.map((r) => ({ problemId: r.problemId, category: r.category!, at: r.createdAt.getTime() }));
  return { items, assessments, analyses };
}

// ── The profile ───────────────────────────────────────────────────

const profileKey = (userId: string) => `skill-profile:v1:${userId}`;

export function skillProfileFor(userId: string, asOf?: number): Promise<SkillProfile> {
  const build = async () => {
    const cat = await skillCatalogues();
    const { items, assessments, analyses } = await loadEvidence(userId, cat);
    return buildSkillProfile({ items, assessments, analyses, catalogue: cat.catalogue, problems: cat.problems, asOf: asOf ?? Date.now() });
  };
  // A historical read (tests, a script) is never cached under the live key,
  // and never written to the review index.
  if (asOf != null) return build();
  return cached(profileKey(userId), 60_000, async () => {
    const profile = await build();
    noteReviewDue(userId, profile).catch((err) => console.error("review index write failed:", (err as Error).message));
    return profile;
  });
}

// ── The review index ──────────────────────────────────────────────

/** Skills kept on an index row — the reminder names two or three. */
const INDEX_SKILLS = 8;
/** Rewritten at least this often even unchanged, so `computedAt` stays a fair "checked since". */
const INDEX_REFRESH_MS = 6 * 60 * 60_000;
/** What each account's row last said, and when — so a profile computed every minute writes only when it changes. */
const written = new Map<string, { sig: string; at: number }>();
const WRITTEN_CAP = 50_000;

/** A row's content from a profile: the started skills' next reviews, soonest first. Pure. */
export function reviewIndexOf(profile: SkillProfile): Array<{ key: string; label: string; dueAt: string }> {
  return [...profile.scored.values()]
    .filter((s) => s.score.review)
    .map((s) => ({ key: s.node.key, label: s.node.label, dueAt: new Date(s.score.review!.nextReviewAt).toISOString() }))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.key.localeCompare(b.key))
    .slice(0, INDEX_SKILLS);
}

/**
 * Keep ReviewDue in step with the profile just computed: the earliest next
 * review and the few after it, or no row when nothing has been solved yet.
 * The review reminder reads this instead of computing every profile
 * (services/review-reminders.ts).
 */
async function noteReviewDue(userId: string, profile: SkillProfile): Promise<void> {
  const skills = reviewIndexOf(profile);
  const sig = JSON.stringify(skills);
  const last = written.get(userId);
  if (last && last.sig === sig && Date.now() - last.at < INDEX_REFRESH_MS) return;
  if (!skills.length) {
    await prisma.reviewDue.deleteMany({ where: { userId } });
  } else {
    const row = { dueAt: new Date(skills[0]!.dueAt), skills, computedAt: new Date(profile.view.asOf) };
    await prisma.reviewDue.upsert({ where: { userId }, create: { userId, ...row }, update: row });
  }
  // Noted only once written: a failed write is tried again on the next profile.
  if (written.size >= WRITTEN_CAP) written.clear();
  written.set(userId, { sig, at: Date.now() });
}

/** Called by invalidateDashboard: a verdict, a hunt, a query or a sitting just changed the evidence. */
export function invalidateSkillProfile(userId: string): void {
  invalidate(profileKey(userId));
}

/** Every key in the graph, for validating a route parameter without loading anything. */
export const SKILL_KEYS: ReadonlySet<string> = new Set(SKILLS.map((s) => s.key));

// ── Recording engagement ──────────────────────────────────────────

export type EngagementEvent = "open" | "hints" | "editorial";
export const ENGAGEMENT_EVENTS: ReadonlySet<string> = new Set<EngagementEvent>(["open", "hints", "editorial"]);

/**
 * Note a first contact. Each column is written once — the scoring wants
 * the first time help was open, so a later visit must never move it — and
 * the row is created by whichever event comes first (opening the editorial
 * from a shared link opens the problem too).
 *
 * Two statements rather than a raw INSERT … ON DUPLICATE KEY UPDATE with
 * COALESCE: both are on the primary key, and the Prisma form keeps the
 * column names checked by the compiler.
 */
export async function recordEngagement(userId: string, problemId: string, event: EngagementEvent): Promise<void> {
  const now = new Date();
  const first = event === "hints" ? { hintsAt: now } : event === "editorial" ? { editorialAt: now } : {};
  const created = await prisma.problemEngagement.createMany({ data: [{ userId, problemId, openedAt: now, ...first }], skipDuplicates: true });
  let changed = created.count;
  if (!created.count && event === "hints") {
    changed = (await prisma.problemEngagement.updateMany({ where: { userId, problemId, hintsAt: null }, data: { hintsAt: now } })).count;
  } else if (!created.count && event === "editorial") {
    changed = (await prisma.problemEngagement.updateMany({ where: { userId, problemId, editorialAt: null }, data: { editorialAt: now } })).count;
  }
  if (changed) invalidateSkillProfile(userId);
}
