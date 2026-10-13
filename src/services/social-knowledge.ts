/**
 * The social module's knowledge base: the day's problem, question or topic,
 * read from the catalogue itself — the published problems (the cached
 * catalogue + the problem row), the aptitude bank, the roadmap tutorials
 * and CS notes shipped in the image, the SQL problems in code, and the
 * company hubs. A problem seeded tomorrow is in tomorrow's pool with no
 * change here.
 *
 * Pure parsing is lib/social/item.ts; this file only chooses and loads.
 * A pick whose source lacks what its slides need (a problem without an
 * editorial yet) is passed over for the next candidate, a few times, before
 * the day fails.
 */

import { prisma } from "../lib/prisma.js";
import { APTITUDE_CANONICAL, aptitudeTopic } from "../lib/aptitude-topics.js";
import { isCompanyTag } from "../lib/companies.js";
import { allNotes, notePath, subjectByKey } from "../lib/cs-notes.js";
import { allLessons } from "../lib/roadmap-lessons.js";
import { SQL_PROBLEMS } from "../lib/sql-problems/index.js";
import { MOTIVATION_ANGLES, pick, seedOf, type ThemeId } from "../lib/social/calendar.js";
import { FEATURES } from "../lib/social/features.js";
import { plain, prose, readDescription, readEditorial, readSolution, type Item } from "../lib/social/item.js";
import type { SiteFacts } from "../lib/social/posts.js";
import { getCatalogue } from "./dashboard.js";
import { hubIndex } from "./problem-hubs.js";

export class KnowledgeError extends Error {}

/** Candidates tried per day before giving up; each is one small read. */
const TRIES = 6;
/** A company needs this many tagged problems to be a day's subject — the hubs Google indexes start at 6 too. */
const MIN_COMPANY_PROBLEMS = 6;

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : []);

/** The `##` headings of a lesson or note body: what "the full guide covers". */
const headingsOf = (body: string) => [...body.matchAll(/^##\s+(.+)$/gm)].map((m) => plain(m[1])).filter((h) => !/^interview questions$/i.test(h));

async function problemItem(slug: string, theme: ThemeId): Promise<Item | null> {
  const p = await prisma.problem.findFirst({
    where: { slug, isPublished: true },
    select: { slug: true, title: true, difficulty: true, tags: true, description: true, editorial: true, hints: true },
  });
  if (!p) return null;
  const tags = strings(p.tags);
  const item: Item = {
    theme,
    key: `problem:${p.slug}`,
    path: `/problems/${p.slug}`,
    title: p.title,
    difficulty: p.difficulty.charAt(0) + p.difficulty.slice(1).toLowerCase(),
    topics: tags.filter((t) => !isCompanyTag(t)),
    companies: tags.filter(isCompanyTag),
    hints: strings(p.hints).map(plain).filter(Boolean),
    ...readDescription(p.description),
    ...readEditorial(p.editorial),
  };
  // The slides teach the idea and the approach; a problem without both is not a day's subject.
  return item.statement && item.idea && item.steps?.length ? item : null;
}

async function companyDay(day: string, seed: number, used: ReadonlySet<string>): Promise<Item> {
  const [index, catalogue] = await Promise.all([hubIndex(), getCatalogue()]);
  const companies = index.companies.filter((c) => c.count >= MIN_COMPANY_PROBLEMS);
  const tried = new Set(used);
  for (let i = 0; i < TRIES; i++) {
    const hub = pick(companies, seed + i * 104_729, tried, (c) => `company:${c.slug}`);
    if (!hub) break;
    tried.add(`company:${hub.slug}`);
    const rows = catalogue.filter((r) => strings(r.tags).includes(hub.tag ?? hub.label));
    for (let j = 0; j < TRIES; j++) {
      const row = pick(rows, seedOf(`${day}:${hub.slug}:${j}`), tried, (r) => `problem:${r.slug}`);
      if (!row) break;
      tried.add(`problem:${row.slug}`);
      const item = await problemItem(row.slug, "company-dsa");
      if (item) return { ...item, company: hub.label, companySlug: hub.slug };
    }
  }
  throw new KnowledgeError("No company problem with an editorial could be found.");
}

async function aptitudeDay(seed: number, used: ReadonlySet<string>): Promise<Item> {
  // The restated duplicates point at their originals (APTITUDE_CANONICAL); only originals are posted.
  const slugs = (await prisma.aptitudeQuestion.findMany({ select: { slug: true }, orderBy: { slug: "asc" } })).map((q) => q.slug).filter((s) => !APTITUDE_CANONICAL[s]);
  const tried = new Set(used);
  for (let i = 0; i < TRIES; i++) {
    const slug = pick(slugs, seed + i * 7919, tried, (s) => `aptitude:${s}`);
    if (!slug) break;
    tried.add(`aptitude:${slug}`);
    const q = await prisma.aptitudeQuestion.findUnique({ where: { slug } });
    const options = strings(q?.options).map(plain);
    if (!q || options.length < 2 || !options[q.answer]) continue;
    return {
      theme: "aptitude",
      key: `aptitude:${q.slug}`,
      path: `/aptitude/q/${q.slug}`,
      title: q.title,
      difficulty: q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1),
      topics: [aptitudeTopic(q.topic)?.label ?? q.topic],
      question: prose(q.prompt).join(" ") || plain(q.prompt),
      options,
      answer: q.answer,
      approach: prose(q.approach).join(" "),
      solution: readSolution(q.solution),
      seconds: q.timeTargetSec,
    };
  }
  throw new KnowledgeError("No aptitude question could be read.");
}

export async function itemFor(theme: ThemeId, day: string, used: ReadonlySet<string>, salt = ""): Promise<Item> {
  const seed = seedOf(`${day}:${theme}${salt}`);
  switch (theme) {
    case "company-dsa":
      return companyDay(`${day}${salt}`, seed, used);
    case "aptitude":
      return aptitudeDay(seed, used);
    case "concept": {
      const lesson = pick(allLessons(), seed, used, (l) => `lesson:${l.slug}`);
      if (!lesson) throw new KnowledgeError("No roadmap tutorials are shipped.");
      return {
        theme,
        key: `lesson:${lesson.slug}`,
        path: `/roadmap/${lesson.slug}`,
        title: lesson.title,
        difficulty: lesson.level.charAt(0).toUpperCase() + lesson.level.slice(1),
        topics: [],
        summary: lesson.answer,
        faq: lesson.faq.slice(0, 6),
        sections: headingsOf(lesson.body).slice(0, 8),
      };
    }
    case "cs-fundamentals": {
      const note = pick(allNotes(), seed, used, (n) => `note:${notePath(n)}`);
      if (!note) throw new KnowledgeError("No CS notes are shipped.");
      return {
        theme,
        key: `note:${notePath(note)}`,
        path: notePath(note),
        title: note.title,
        difficulty: note.level.charAt(0).toUpperCase() + note.level.slice(1),
        topics: [subjectByKey(note.subject)?.title ?? note.subject],
        summary: note.answer,
        faq: note.faq.slice(0, 6),
        sections: headingsOf(note.body).slice(0, 8),
      };
    }
    case "sql": {
      const spec = pick(SQL_PROBLEMS, seed, used, (s) => `sql:${s.slug}`);
      if (!spec) throw new KnowledgeError("No SQL problems are shipped.");
      return {
        theme,
        key: `sql:${spec.slug}`,
        path: `/sql/${spec.slug}`,
        title: spec.title,
        difficulty: spec.difficulty.charAt(0) + spec.difficulty.slice(1).toLowerCase(),
        topics: spec.topics,
        statement: prose(spec.description).join("\n\n"),
        tables: spec.tables.map((t) => [t.name, ...t.columns.map((c) => `  ${c.name}  ${c.type}`)].join("\n")).join("\n\n"),
      };
    }
    case "motivation": {
      const angle = pick(MOTIVATION_ANGLES, seed, used, (a) => `angle:${seedOf(a)}`) as string;
      return { theme, key: `angle:${seedOf(angle)}`, path: "/roadmap", title: angle, angle };
    }
    case "product": {
      const f = pick(FEATURES, seed, used, (x) => `feature:${x.key}`);
      if (!f) throw new KnowledgeError("No features are listed.");
      return { theme, key: `feature:${f.key}`, path: f.path, title: f.name, feature: { name: f.name, summary: f.summary } };
    }
  }
}

/**
 * What the posts may say about CodeKairo, with today's counts read live —
 * the one place a number about the site enters a prompt.
 */
export async function siteFacts(): Promise<SiteFacts> {
  const [catalogue, aptitude] = await Promise.all([getCatalogue(), prisma.aptitudeQuestion.count()]);
  const round = (n: number) => (n >= 100 ? `more than ${(Math.floor(n / 100) * 100).toLocaleString("en-IN")}` : String(n));
  return {
    summary:
      `CodeKairo is a free-to-start placement and interview preparation site: ${round(catalogue.length)} DSA problems judged by hidden tests in 13 programming languages, ` +
      `${round(aptitude)} aptitude questions, ${SQL_PROBLEMS.length >= 100 ? round(SQL_PROBLEMS.length) : SQL_PROBLEMS.length} SQL problems, a DSA roadmap with ${allLessons().length} tutorials, ` +
      `${allNotes().length} CS notes, placement mock tests modelled on company patterns, AI mock interviews, a resume ATS analyzer and skill certificates. ` +
      "A free account covers the core features; paid plans raise the mock-interview and bug-hunt limits.",
    features: FEATURES.map((f) => ({ name: f.name, summary: f.summary })),
  };
}
