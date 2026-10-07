import { prisma } from "../lib/prisma.js";
import { cached, invalidate } from "../lib/cache.js";
import { COMPANY_RENAMED, COMPANY_TAGS } from "../lib/companies.js";
import { aptitudeTopic } from "../lib/aptitude-topics.js";
import { skillsForProblemTags } from "../lib/skill-graph.js";
import { slugify } from "../lib/slug.js";
import { implicitTargetCompany } from "../lib/onboarding.js";
import { INTERVIEW_SKILL_WEIGHTS, companyKey, readinessOf, type PatternSection, type Readiness, type ReadinessFamily, type TargetPattern } from "../lib/readiness.js";
import { interviewSkillWeights, simulationForCompany } from "../lib/simulations/index.js";
import { getCatalogue } from "./dashboard.js";
import { skillProfileFor } from "./skill-profile.js";

/**
 * Readiness for a placement target (Phase 5 of ADAPTIVE_COACH.md; the rules
 * are lib/readiness.ts). Reads, never writes, except the target itself:
 * the company's seeded test patterns, the skill profile, the account's
 * sittings of those patterns, its sat mock interviews and its resume
 * analyses — all rows that already exist.
 */

/** The service-company hiring rounds of COMPANY_TAGS (lib/companies.ts groups them so). */
const SERVICE = new Set(["TCS", "Infosys", "Wipro", "Capgemini", "Cognizant", "Accenture", "HCL", "Tech Mahindra", "Mphasis", "Virtusa", "Mindtree"].map(companyKey));

interface PatternRow extends TargetPattern {
  company: string;
  family: string;
}

/** Every published company pattern, with its sections, as readiness reads them. */
function patterns(): Promise<PatternRow[]> {
  return cached("readiness:patterns:v1", 10 * 60_000, async () => {
    const tests = await prisma.mockTest.findMany({
      where: { published: true, family: { in: ["service", "product"] } },
      orderBy: { orderIndex: "asc" },
      select: {
        slug: true,
        name: true,
        company: true,
        family: true,
        sourceNote: true,
        sections: { orderBy: { orderIndex: "asc" }, select: { key: true, name: true, kind: true, questionCount: true, marksPerQuestion: true, blueprint: true } },
      },
    });
    return tests.map((t) => ({
      slug: t.slug,
      name: t.name,
      company: t.company,
      family: t.family,
      sourceNote: t.sourceNote,
      sections: t.sections.map(
        (s): PatternSection => ({
          key: s.key,
          name: s.name,
          kind: s.kind === "coding" ? "coding" : "mcq",
          questionCount: s.questionCount,
          marksPerQuestion: s.marksPerQuestion,
          blueprint: Array.isArray(s.blueprint) ? (s.blueprint as unknown as PatternSection["blueprint"]) : [],
        }),
      ),
    }));
  });
}

export interface CompanyChoice {
  /** The name as the site spells it (the tag where there is one). */
  name: string;
  family: ReadinessFamily;
  /** Its test patterns — the roles a target can name. */
  tests: Array<{ slug: string; name: string }>;
  hasProblems: boolean;
}

/** Every company a target can name: the tags, and the pattern companies the tags lack. */
export async function companyChoices(): Promise<CompanyChoice[]> {
  const rows = await patterns();
  const byKey = new Map<string, CompanyChoice>();
  for (const tag of COMPANY_TAGS) {
    if (COMPANY_RENAMED[tag]) continue;
    byKey.set(companyKey(tag), { name: tag, family: SERVICE.has(companyKey(tag)) ? "service" : "product", tests: [], hasProblems: true });
  }
  for (const p of rows) {
    const key = companyKey(p.company);
    const c = byKey.get(key) ?? { name: p.company, family: "product" as ReadinessFamily, tests: [], hasProblems: false };
    c.tests.push({ slug: p.slug, name: p.name });
    byKey.set(key, c);
  }
  // A company with a service-family pattern is read as one (Infosys's Specialist Programmer is a product-style role; naming that test says so).
  for (const p of rows) if (p.family === "service") byKey.get(companyKey(p.company))!.family = "service";
  return [...byKey.values()].sort((a, b) => Number(b.tests.length > 0) - Number(a.tests.length > 0) || a.name.localeCompare(b.name));
}

export interface ReadinessView {
  target: { company: string | null; test: string | null; date: string | null };
  readiness: Readiness | null;
  companies: CompanyChoice[];
}

const readinessKey = (userId: string, company: string, test: string | null) => `readiness:v2:${userId}:${companyKey(company)}:${test ?? "*"}`;

export async function readinessFor(userId: string, asked: { company?: string | null; test?: string | null }): Promise<ReadinessView> {
  const [user, companies] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { targetCompany: true, targetTest: true, targetDate: true, dailyMinutes: true, goal: true, goalDetails: true } }),
    companyChoices(),
  ]);
  // No saved target: the first company named at onboarding (the dashboard and the mission read the same).
  const companyName = asked.company ?? user?.targetCompany ?? implicitTargetCompany(user?.goal ?? null, user?.goalDetails);
  const target = { company: user?.targetCompany ?? null, test: user?.targetTest ?? null, date: user?.targetDate ? user.targetDate.toISOString().slice(0, 10) : null };
  const choice = companyName ? companies.find((c) => companyKey(c.name) === companyKey(companyName)) : undefined;
  if (!choice) return { target, readiness: null, companies };
  // The test named in the request, else the saved one when it is this company's.
  const testSlug = asked.test !== undefined ? asked.test : companyKey(choice.name) === companyKey(user?.targetCompany ?? "") ? (user?.targetTest ?? null) : null;

  const readiness = await cached(readinessKey(userId, choice.name, testSlug), 60_000, async () => {
    const all = (await patterns()).filter((p) => companyKey(p.company) === companyKey(choice.name));
    const chosen = testSlug ? all.filter((p) => p.slug === testSlug) : all;
    const family: ReadinessFamily = chosen.length ? (chosen.some((p) => p.family === "service") ? "service" : "product") : choice.family;
    const [profile, catalogue, attempts, analyses] = await Promise.all([
      skillProfileFor(userId),
      getCatalogue(),
      chosen.length
        ? prisma.mockAttempt.findMany({
            where: { userId, status: { in: ["submitted", "expired"] }, test: { slug: { in: chosen.map((p) => p.slug) } } },
            orderBy: { startedAt: "desc" },
            take: 20,
            select: { score: true, maxScore: true, submittedAt: true, startedAt: true, test: { select: { slug: true } } },
          })
        : Promise.resolve([]),
      prisma.resumeAnalysis.findMany({
        where: { userId, status: "done", score: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { score: true, company: true, createdAt: true },
      }),
    ]);

    // The DSA skills the company's tagged problems use; the catalogue's most common when it has none.
    const tag = COMPANY_TAGS.find((t) => companyKey(t) === companyKey(choice.name)) ?? null;
    const counts = new Map<string, number>();
    const everyCounts = new Map<string, number>();
    for (const p of catalogue) {
      const tags = Array.isArray(p.tags) ? (p.tags as string[]) : [];
      for (const k of skillsForProblemTags(tags)) {
        if (!k.startsWith("dsa:")) continue;
        everyCounts.set(k, (everyCounts.get(k) ?? 0) + 1);
        if (tag && tags.includes(tag)) counts.set(k, (counts.get(k) ?? 0) + 1);
      }
    }
    const coding = (counts.size ? counts : everyCounts).entries();

    const sim = simulationForCompany(choice.name);
    const forCompany = analyses.find((a) => a.company && companyKey(a.company) === companyKey(choice.name));
    const resume = forCompany ?? analyses[0] ?? null;
    return readinessOf({
      company: choice.name,
      family,
      patterns: chosen,
      skill: (key) => {
        const s = profile.scored.get(key);
        return s ? { key, mastery: s.score.mastery, confidence: s.score.confidence, label: s.node.label, href: s.node.href } : null;
      },
      categoryOfTopic: (t) => aptitudeTopic(t)?.category ?? null,
      skillsForTags: (tags) => skillsForProblemTags(tags).filter((k) => k.startsWith("dsa:")),
      codingSkills: [...coding].map(([key, problems]) => ({ key, problems })),
      companyHref: tag && counts.size ? `/challenges/company/${slugify(tag)}` : null,
      sittings: attempts
        .filter((a) => a.score != null && a.maxScore)
        .map((a) => ({ slug: a.test.slug, pct: (100 * a.score!) / a.maxScore!, at: (a.submittedAt ?? a.startedAt).getTime() })),
      // The company's sourced interview rounds (lib/simulations) when it has a simulation; a family's usual mix otherwise.
      interviewSkills: sim ? interviewSkillWeights(sim) : Object.entries(INTERVIEW_SKILL_WEIGHTS[family]).map(([key, weight]) => ({ key, weight })),
      simulationHref: sim ? `/simulations/${sim.slug}` : null,
      resume: resume ? { score: resume.score!, at: resume.createdAt.getTime(), forCompany: resume === forCompany } : null,
      targetDate: companyKey(choice.name) === companyKey(user?.targetCompany ?? "") && user?.targetDate ? user.targetDate.getTime() : null,
      dailyMinutes: user?.dailyMinutes ?? null,
      asOf: Date.now(),
    });
  });
  return { target, readiness, companies };
}

export class TargetError extends Error {}

/**
 * Save the target. A company must be one the site knows (a tag or a pattern
 * company), a test one of its patterns, a date a real day no more than two
 * years out. Clearing the company clears the rest.
 */
export async function setTarget(userId: string, body: { company?: unknown; test?: unknown; date?: unknown }): Promise<void> {
  const companies = await companyChoices();
  const company = typeof body.company === "string" && body.company.trim() ? companies.find((c) => companyKey(c.name) === companyKey(body.company as string)) : null;
  if (body.company && !company) throw new TargetError("That company is not one the site knows.");
  const test = company && typeof body.test === "string" && body.test ? company.tests.find((t) => t.slug === body.test)?.slug : null;
  if (company && body.test && !test) throw new TargetError("That test is not one of the company's patterns.");
  let date: Date | null = null;
  if (company && typeof body.date === "string" && body.date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) throw new TargetError("Give the date as YYYY-MM-DD.");
    date = new Date(`${body.date}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.getTime() > Date.now() + 2 * 366 * 86_400_000) throw new TargetError("That date is not one readiness can use.");
  }
  await prisma.user.update({ where: { id: userId }, data: { targetCompany: company?.name ?? null, targetTest: test ?? null, targetDate: date } });
  // Every cached reading of this account is keyed by company and test; the
  // target date is read inside them, so the saved company's go.
  if (company) {
    invalidate(readinessKey(userId, company.name, null));
    for (const t of company.tests) invalidate(readinessKey(userId, company.name, t.slug));
  }
}
